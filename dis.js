const axios = require('axios');
const express = require('express');
const https = require('https'); 

// ==================== البيانات الأصلية كاملة ====================
const MAIN_BASE_URL = 'https://anslayer.com/anime/public/anime-comments/';
const CLIENT_ID = 'android-app2';
const CLIENT_SECRET = '7befba6263cc14c90d2f1d6da2c5cf9b251bfbbd';

// مصفوفة التوكنات الخاصة بك
const TOKENS = [
    '24f06b373a5f26ff958c0aa7ff1c97f8a08bdf36',
    'db6111e27a80f449433617b931c8d8483fed3ca1',
    '6ad92e6921ead30c80dbdad594e1331562019bfc',
    '8a803c183ed28eb632f1abfa10509ae2551a904f',
    '7fae3d0d4e1b99ef48b916861064005416c2a217',
    '445d11b5491a80abb7d6755d076f5d7a752971c5',
    'b95ad4f0045438e07a86ddf76e3805eb5c245a7e',
    '5deaec3d7c88d6e94ab42ab93acfa298ca661c46'
];

// قائمة الأسماء المستهدفة بالـ Dislike (يمكنك تعديلها أو إضافة أسماء أخرى هنا)
const TARGET_USERS = [
    'شهاب الليبي',
    'شهاب السوري',
    'شهاب المغربي',
    'الزعيم شِهاب',
    'شِهاب',
    'العقيد شِهَاب',
    'شِهَاب',
    'شِهَاب الافريقي',
    'شِهاب الجزائري',
    'الجنرال شهاب'
];

const TARGET_ANIME_ID = 2025;

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

// إنشاء عميل Axios يحافظ على الاتصال مفتوحاً
const httpAgent = new https.Agent({ 
    keepAlive: true, 
    maxSockets: 100, 
    keepAliveMsecs: 30000 
});

const fastAxios = axios.create({
    httpsAgent: httpAgent,
    timeout: 5000 
});

// ===================================================================
const app = express();
const PORT = process.env.PORT || 3000;
app.get('/', (req, res) => res.send('رادار Chat Slayer يعمل بنجاح ومستعد للهجوم 24/7! 🚀'));
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
    console.log(`\n⚔️ الهجوم على الرد: [${replyId}] للكاتب [${author}] - "${text.substring(0, 30)}..."`);

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
                        
                        // فحص الأمان واستهداف الأسماء المحددة فقط في القائمة
                        if (TARGET_USERS.length > 0 && TARGET_USERS.includes(reply.user_full_name)) {
                            console.log(`\n🚨 [رادار] تم رصد رد جديد يطابق الحساب المستهدف [${reply.user_full_name}]`);
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
                // تجاهل الأخطاء الفردية لضمان استمرار الفحص
            }
        }));

    } catch (error) {
        console.error('\n❌ خطأ أثناء دورة الفحص:', error.message);
    }

    isScanning = false;
}

// التكرار المستقر لضمان عدم حظر الاستضافة
function startLoop() {
    scanAndAttack().then(() => {
        setTimeout(startLoop, 50); 
    });
}

console.log('🚀 بدء تشغيل رادار الردود المستقر والموجه...');
console.log('📡 يتم الفحص بذكاء لضمان استقرار السيرفر...\n');

startLoop();
