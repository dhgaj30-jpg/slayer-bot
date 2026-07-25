const axios = require('axios');
const express = require('express');

// الثوابت الأساسية
const MAIN_BASE_URL = 'https://anslayer.com/anime/public/anime-comments/';
const CLIENT_ID = 'android-app2';
const CLIENT_SECRET = '7befba6263cc14c90d2f1d6da2c5cf9b251bfbbd';

// التوكنات
const TOKENS = [
    '24f06b373a5f26ff958c0aa7ff1c97f8a08bdf36', // نايك ام نوح
    'db6111e27a80f449433617b931c8d8483fed3ca1', // داعس كس ام نوح
    '6ad92e6921ead30c80dbdad594e1331562019bfc', // نايك ابن الزانية نوح
    '8a803c183ed28eb632f1abfa10509ae2551a904f', // نايك كساس اهل نوح
    '7fae3d0d4e1b99ef48b916861064005416c2a217', // داعس بزازم نوح
    '445d11b5491a80abb7d6755d076f5d7a752971c5', // فحل ابن الشرموطة نوح
    'b95ad4f0045438e07a86ddf76e3805eb5c245a7e'  // داعس نوح وكس ام نوح واهله
];
const TARGET_ANIME_ID = 2025;

// قائمة مسارات محتملة للاكتشاف التلقائي
const ENDPOINTS_TO_TRY = [
    'add-anime-comment-reply-dislike',
    'dislike-comment-reply',
    'anime-comment-reply-dislike',
    'add-reply-dislike',
    'set-anime-comment-reply-dislike'
];

// الذاكرة
let WORKING_ENDPOINT = null;
const processedReplies = new Set();
let isScanning = false;

// ===================================================================
// خادم ويب مصغر لإبقاء السكربت حيًا
// ===================================================================
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('رادار Chat Slayer يعمل بنجاح ومستعد للهجوم 24/7! 🚀');
});

app.listen(PORT, () => {
    console.log(`🌐 خادم الويب يعمل على المنفذ ${PORT}`);
});
// ===================================================================

async function hitDislike(token, commentId, replyId) {
    // إذا وُجد مسار صحيح مسبقًا نستخدمه مباشرة
    const endpoints = WORKING_ENDPOINT ? [WORKING_ENDPOINT] : ENDPOINTS_TO_TRY;

    for (const endpoint of endpoints) {
        try {
            const res = await axios.post(`${MAIN_BASE_URL}${endpoint}`, {
                anime_comment_id: commentId,
                anime_comment_reply_id: replyId
            }, {
                headers: {
                    'User-Agent': 'Dalvik/2.1.0 (Linux; U; Android 11; Build/RP1A.200720.011)',
                    'Content-Type': 'application/json',
                    'Client-Id': CLIENT_ID,
                    'Client-Secret': CLIENT_SECRET,
                    'X-Requested-With': 'com.anslayer.app',
                    'Authorization': `Bearer ${token}`
                }
            });

            // نجاح -> نحفظ المسار الصحيح
            if (!WORKING_ENDPOINT) {
                console.log(`🎉 [اكتشاف] تم العثور على المسار الصحيح: ${endpoint}`);
                WORKING_ENDPOINT = endpoint;
            }
            return { success: true };

        } catch (error) {
            // أي رد غير 404 يعني أن المسار موجود (ولو رفض التوكن)
            if (error.response && error.response.status !== 404) {
                if (!WORKING_ENDPOINT) {
                    console.log(`🎉 [اكتشاف] تم العثور على المسار الصحيح: ${endpoint}`);
                    WORKING_ENDPOINT = endpoint;
                }
                throw error; // نرمي الخطأ ليتم التعامل معه في attackReply
            }
            // 404 -> نجرب المسار التالي
            continue;
        }
    }
    throw new Error("جميع المسارات المحتملة أعطت 404!");
}

async function attackReply(commentId, replyId, text, author) {
    console.log(`⚔️  الهجوم على الرد [${replyId}] للكاتب [${author}] - "${text.substring(0, 30)}..."`);

    const dislikePromises = TOKENS.map(async (token, index) => {
        try {
            await hitDislike(token, commentId, replyId);
            console.log(`✅ [الحساب ${index + 1}]: تمت إضافة الديس لايك`);
        } catch (error) {
            console.error(`❌ [الحساب ${index + 1}]: فشل - ${error.response?.data?.detail || error.message}`);
        }
    });

    await Promise.all(dislikePromises);
    console.log(`✅ انتهت موجة الهجوم على الرد [${replyId}]`);
}

async function scanAndAttack() {
    if (isScanning) return;
    isScanning = true;

    try {
        // تنظيف دوري للذاكرة
        if (processedReplies.size > 1000) {
            processedReplies.clear();
            console.log('🧹 [تنظيف] تم تفريغ ذاكرة الردود القديمة');
        }

        const jsonQuery = encodeURIComponent(JSON.stringify({ anime_id: TARGET_ANIME_ID, page: 1 }));
        const commentsRes = await axios.get(`${MAIN_BASE_URL}get-anime-comments?json=${jsonQuery}`, {
            headers: {
                'User-Agent': 'Dalvik/2.1.0 (Linux; U; Android 11; Build/RP1A.200720.011)',
                'Client-Id': CLIENT_ID,
                'Client-Secret': CLIENT_SECRET,
                'X-Requested-With': 'com.anslayer.app'
            }
        });

        const commentsList = commentsRes.data?.response?.data || [];
        if (commentsList.length === 0) {
            isScanning = false;
            return;
        }

        // نفحص آخر تعليقين فقط لتسريع العملية
        const topComments = commentsList.slice(0, 2);

        // جلب الردود لكل تعليق بشكل متوازٍ
        const repliesPromises = topComments.map(async (comment) => {
            const commentId = comment.anime_comment_id;
            const repliesQuery = encodeURIComponent(JSON.stringify({ anime_comment_id: commentId, page: 1 }));
            const repliesRes = await axios.get(`${MAIN_BASE_URL}get-anime-comment-replies?json=${repliesQuery}`, {
                headers: {
                    'User-Agent': 'Dalvik/2.1.0 (Linux; U; Android 11; Build/RP1A.200720.011)',
                    'Client-Id': CLIENT_ID,
                    'Client-Secret': CLIENT_SECRET,
                    'X-Requested-With': 'com.anslayer.app'
                }
            });
            const replies = repliesRes.data?.response?.data || [];
            return { commentId, replies };
        });

        const commentsReplies = await Promise.all(repliesPromises);

        // جمع كل الردود الجديدة
        const newRepliesAll = [];
        for (const { commentId, replies } of commentsReplies) {
            const newOnes = replies.filter(reply => !processedReplies.has(reply.anime_comment_reply_id));
            for (const reply of newOnes) {
                processedReplies.add(reply.anime_comment_reply_id);
                newRepliesAll.push({ commentId, reply });
            }
        }

        if (newRepliesAll.length > 0) {
            console.log(`🚨 [رادار] رصد ${newRepliesAll.length} ردود جديدة`);

            // نهاجم كل رد جديد بالتتابع (للحفاظ على الأداء وتجنب الحظر الجماعي)
            for (const { commentId, reply } of newRepliesAll) {
                await attackReply(
                    commentId,
                    reply.anime_comment_reply_id,
                    reply.reply_text,
                    reply.user_full_name
                );
            }
        }

    } catch (error) {
        console.error('❌ خطأ أثناء دورة الفحص:', error.message);
    }

    isScanning = false;

    // جدولة الفحص التالي بعد 100ms فقط (أسرع وأكثر استجابة)
    setTimeout(scanAndAttack, 1);
}

console.log('🚀 بدء تشغيل رادار الردود السريع...');
console.log('📡 يتم فحص أحدث تعليقين وردودهما كل 100 مللي ثانية تقريبًا...\n');

scanAndAttack();
