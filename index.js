// dislike_all_replies_2_comments.js
const axios = require('axios');
const https = require('https');

const BASE = 'https://anslayer.com/anime/public/anime-comments/';
const CLIENT_ID = 'android-app2';
const CLIENT_SECRET = '7befba6263cc14c90d2f1d6da2c5cf9b251bfbbd';
const TARGET_ANIME_ID = 2025;

// التوكنات المحددة فقط
const TOKENS = [
    '5a4610c296d25043f48b4ac9f4b652541929199f',
    'ba3e81f3108294c289af82ac6e7138632290344e',
    'bbeeba74c11b1eede2d2e33d855e8dc3779782dd',
    'ab03d7f20c753a0375a7d52647f60fb9b475eaa4'
];

// إعداد HTTPS Agent
const agent = new https.Agent({ keepAlive: true, maxSockets: 60, keepAliveMsecs: 30000 });
const http = axios.create({ httpsAgent: agent, timeout: 10000 });

// تخزين معرفات الردود المعالجة
const processedReplies = new Set();

// دالة إرسال ديسلايك لحساب واحد
async function sendDislike(token, replyId) {
    const params = new URLSearchParams();
    params.append('anime_comment_reply_id', String(replyId));

    try {
        await http.post(`${BASE}anime-comment-reply-dislike`, params.toString(), {
            headers: {
                'User-Agent': 'Dalvik/2.1.0 (Linux; U; Android 11; Build/RP1A.200720.011)',
                'Content-Type': 'application/x-www-form-urlencoded',
                'Client-Id': CLIENT_ID,
                'Client-Secret': CLIENT_SECRET,
                'X-Requested-With': 'com.anslayer.app',
                'Authorization': `Bearer ${token}`
            }
        });
        return true;
    } catch (err) {
        return false;
    }
}

// دالة الهجوم على رد واحد (كل التوكنات بالتوازي)
async function attackReply(replyId, authorName, replyText) {
    console.log(`⚔️ هجوم ديسلايك على رد ${replyId} من ${authorName}`);
    const results = await Promise.all(
        TOKENS.map(async (token, i) => {
            const success = await sendDislike(token, replyId);
            console.log(`  [${i+1}] ${success ? '✅ تم' : '❌ فشل'}`);
            return success;
        })
    );
    const count = results.filter(Boolean).length;
    console.log(`✅ اكتمل الهجوم: ${count}/${TOKENS.length} نجحوا\n`);
}

// دالة جلب أحدث تعليقين
async function fetchLatestComments(limit = 2) {
    const params = { anime_id: TARGET_ANIME_ID, _offset: 0, _limit: limit };
    const url = `${BASE}get-anime-comments?json=${encodeURIComponent(JSON.stringify(params))}`;
    try {
        const res = await http.get(url, {
            headers: {
                'User-Agent': 'Dalvik/2.1.0 (Linux; U; Android 11; Build/RP1A.200720.011)',
                'Client-Id': CLIENT_ID,
                'Client-Secret': CLIENT_SECRET,
                'X-Requested-With': 'com.anslayer.app'
            }
        });
        return res.data?.response?.data || res.data?.data || [];
    } catch (err) {
        return [];
    }
}

// دالة جلب جميع ردود تعليق معين (حتى 100 رد، يمكن زيادتها)
async function fetchReplies(commentId) {
    const params = { anime_comment_id: commentId, _offset: 0, _limit: 100 };
    const url = `${BASE}get-anime-comment-replies?json=${encodeURIComponent(JSON.stringify(params))}`;
    try {
        const res = await http.get(url, {
            headers: {
                'User-Agent': 'Dalvik/2.1.0 (Linux; U; Android 11; Build/RP1A.200720.011)',
                'Client-Id': CLIENT_ID,
                'Client-Secret': CLIENT_SECRET,
                'X-Requested-With': 'com.anslayer.app'
            }
        });
        return res.data?.response?.data || res.data?.data || [];
    } catch (err) {
        return [];
    }
}

// دورة الفحص والهجوم
async function scanAndAttack() {
    console.log('🔄 فحص أحدث تعليقين...');
    const comments = await fetchLatestComments(2);

    if (comments.length === 0) {
        console.log('⚠️ لا توجد تعليقات.');
        return;
    }

    console.log(`📋 عدد التعليقات: ${comments.length}`);

    for (const comment of comments) {
        const commentId = comment.anime_comment_id;
        console.log(`🔍 جلب ردود التعليق ${commentId}...`);
        const replies = await fetchReplies(commentId);
        console.log(`💬 عدد الردود: ${replies.length}`);

        for (const reply of replies) {
            const replyId = reply.anime_comment_reply_id;
            if (processedReplies.has(replyId)) continue;

            processedReplies.add(replyId);
            const author = reply.user_full_name || 'مجهول';
            const text = reply.reply_text || '';
            await attackReply(replyId, author, text);

            // تنظيف المجموعة إذا كبرت
            if (processedReplies.size > 1000) {
                processedReplies.clear();
                console.log('🧹 تم تفريغ الذاكرة.');
            }
        }
    }
}

// تشغيل مستمر
async function main() {
    console.log('🚀 بدأ رادار الديسلايك الشامل (أحدث تعليقين، كل ردودهم)');
    console.log(`📌 عدد الحسابات: ${TOKENS.length}`);
    console.log(`📌 الهدف: أنمي ${TARGET_ANIME_ID}\n`);

    while (true) {
        await scanAndAttack();
        // انتظر 10 ثوانٍ قبل الدورة التالية
        await new Promise(resolve => setTimeout(resolve, 10000));
    }
}

main().catch(err => {
    console.error('خطأ فادح:', err.message);
    process.exit(1);
});
