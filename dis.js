const axios = require('axios');
const express = require('express');
const https = require('https'); 

// الثوابت الأساسية
const MAIN_BASE_URL = 'https://anslayer.com/anime/public/anime-comments/';
const CLIENT_ID = 'android-app2';
const CLIENT_SECRET = '7befba6263cc14c90d2f1d6da2c5cf9b251bfbbd';

// 🔥 التوكنات الجديدة الخمسة (تم استبعاد حساب kft)
const TOKENS = [
    'cb759654c9e7fe7ae87e49fc6cd86dd8a1be8dcd', // harwnalnzy544@gmail.com
    '65aeb482636a5f2877ccb84a262b679b973ccd00', // dalob5655@gmail.com
    'c14c9bdea002f58ffe1822a361d8cfcbdb03977f', // dysd5042@gmail.com
    '9fef055ec28a1062974ff6445cc71d7a84140ccc', // hdhe8707@gmail.com
    '166f647bfae98eca54ee8645c96fa3420a2cdead'  // fshl72990@gmail.com
];

const TARGET_ANIME_ID = 2025;

// 🎯 ضع اسم حسابك الثاني بالضبط هنا لكي يتم استهدافه بالضغط
const TARGET_USERS = [
    'Sara Messi',
    'سَٰارةّ',
    '‌‌‌‌‌'
];

const ENDPOINTS_TO_TRY = [
    'add-anime-comment-reply-dislike',
    'dislike-comment-reply',
    'anime-comment-reply-dislike',
    'add-reply-dislike',
    'set-anime-comment-reply-dislike'
];

let WORKING_ENDPOINT = null;
const processedReplies = new Set();
let isScanning = false;

// إعداد عميل Axios سريع ومتزن للحفاظ على استقرار السيرفر في Render
const httpAgent = new https.Agent({ 
    keepAlive: true, 
    maxSockets: 50, 
    keepAliveMsecs: 30000 
});

const fastAxios = axios.create({
    httpsAgent: httpAgent,
    timeout: 5000 
});

// ===================================================================
const app = express();
const PORT = process.env.PORT || 3000;
app.get('/', (req, res) => res.send('رادار الموجه يعمل ومستقر على Render! 🚀'));
app.listen(PORT, () => console.log(`🌐 خادم الويب يعمل على المنفذ ${PORT}`));
// ===================================================================

async function hitDislike(token, commentId, replyId) {
    const endpoints = WORKING_ENDPOINT ? [WORKING_ENDPOINT] : ENDPOINTS_TO_TRY;

    for (const endpoint of endpoints) {
        try {
            await fastAxios.post(`${MAIN_BASE_URL}${endpoint}`, {
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

            if (!WORKING_ENDPOINT) {
                console.log(`\n🎉 [اكتشاف ذكي] تم العثور على المسار الصحيح للسيرفر: ${endpoint}`);
                WORKING_ENDPOINT = endpoint;
            }
            return { success: true };

        } catch (error) {
            if (error.response?.status === 404) continue;
            if (error.response?.status === 400 || error.response?.status === 403) {
                if (!WORKING_ENDPOINT) {
                    console.log(`\n🎉 [اكتشاف ذكي] تم العثور على المسار الصحيح: ${endpoint}`);
                    WORKING_ENDPOINT = endpoint;
                }
                throw error;
            }
            throw error;
        }
    }
    throw new Error("جميع المسارات المحتملة أعطت 404!");
}

async function attackReply(commentId, replyId, text, author) {
    console.log(`\n⚔️ هجوم موجه على الرد: [${replyId}] للكاتب المستهدف [${author}] - "${text.substring(0, 30)}..."`);

    const dislikePromises = TOKENS.map(async (token, index) => {
        try {
            await hitDislike(token, commentId, replyId);
            console.log(`✅ [الحساب ${index + 1}]: تمت إضافة الدس لايك بنجاح!`);
        } catch (error) {
            console.error(`❌ [الحساب ${index + 1}]: فشل - ${error.response?.data?.detail || error.message}`);
        }
    });

    await Promise.all(dislikePromises);
    console.log(`✅ انتهت موجة الهجوم على الرد [${replyId}].`);
}

async function scanAndAttack() {
    if (isScanning) return;
    isScanning = true;

    try {
        if (processedReplies.size > 1000) {
            processedReplies.clear();
            console.log('\n🧹 [تنظيف] تم تفريغ ذاكرة الردود القديمة للحفاظ على الأداء.\n');
        }

        const jsonQuery = encodeURIComponent(JSON.stringify({ anime_id: TARGET_ANIME_ID, page: 1 }));
        const commentsRes = await fastAxios.get(`${MAIN_BASE_URL}get-anime-comments?json=${jsonQuery}`, {
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

        const topComments = commentsList.slice(0, 3);

        await Promise.all(topComments.map(async (comment) => {
            const commentId = comment.anime_comment_id;
            const repliesQuery = encodeURIComponent(JSON.stringify({ anime_comment_id: commentId, page: 1 }));

            try {
                const repliesRes = await fastAxios.get(`${MAIN_BASE_URL}get-anime-comment-replies?json=${repliesQuery}`, {
                    headers: {
                        'User-Agent': 'Dalvik/2.1.0 (Linux; U; Android 11; Build/RP1A.200720.011)',
                        'Client-Id': CLIENT_ID,
                        'Client-Secret': CLIENT_SECRET,
                        'X-Requested-With': 'com.anslayer.app'
                    }
                });

                const repliesList = repliesRes.data?.response?.data || [];
                const newReplies = repliesList.filter(reply => !processedReplies.has(reply.anime_comment_reply_id));

                if (newReplies.length > 0) {
                    await Promise.all(newReplies.map(async (reply) => {
                        processedReplies.add(reply.anime_comment_reply_id);
                        
                        // 🔍 فحص الأمان واستهداف الاسم المطلوب فقط
                        if (TARGET_USERS.length > 0 && TARGET_USERS.includes(reply.user_full_name)) {
                            console.log(`\n🚨 [رادار] تم رصد رد جديد يطابق حسابك المستهدف [${reply.user_full_name}]`);
                            await attackReply(
                                commentId,
                                reply.anime_comment_reply_id,
                                reply.reply_text,
                                reply.user_full_name
                            );
                        }
                    }));
                }
            } catch (err) {
                // تجاهل الأخطاء الفردية
            }
        }));

    } catch (error) {
        console.error('\n❌ خطأ أثناء دورة الفحص:', error.message);
    }

    isScanning = false;
}

// ⏱️ استبدال الـ setImmediate بـ setTimeout بقيمة 500ms لمنع استهلاك معالج Render وحظر السكربت
function startLoop() {
    scanAndAttack().then(() => {
        setTimeout(startLoop, 50); 
    });
}

console.log('🚀 بدء تشغيل رادار الردود المستقر والموجه...');
console.log('📡 يتم الفحص بذكاء لضمان استقرار السيرفر على منصة الاستضافة...\n');

startLoop();
