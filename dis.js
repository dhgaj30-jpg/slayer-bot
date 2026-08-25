const axios = require('axios');
const express = require('express');
const https = require('https'); 

// ==================== الإعدادات الأساسية l====================
const MAIN_BASE_URL = 'https://anslayer.com/anime/public/anime-comments/';
const CLIENT_ID = 'android-app2';
const CLIENT_SECRET = '7befba6263cc14c90d2f1d6da2c5cf9b251bfbbd';

// توكنات الدسات الخاصة بك (10 حسابات)
const TOKENS = [
    'ab03d7f20c753a0375a7d52647f60fb9b475eaa4', // fshl72990
    'bbeeba74c11b1eede2d2e33d855e8dc3779782dd', // hdhe8707
    'ba3e81f3108294c289af82ac6e7138632290344e', // offlod9
    '5a4610c296d25043f48b4ac9f4b652541929199f'// rayanderarjamal
];
const TARGET_ANIME_ID = 2025;
const SKIP_NAME = 'ريّان';

const DISLIKE_ENDPOINTS_TO_TRY = [
    'anime-comment-reply-dislike',
    'add-anime-comment-reply-dislike',
    'dislike-comment-reply',
    'add-reply-dislike',
    'set-anime-comment-reply-dislike'
];

let WORKING_ENDPOINT = null;
const processedReplies = new Set();
let isScanning = false;

// 🔥 هنا السر التقني: إبقاء الاتصال مفتوح لضمان وصول 10/10 دسات في نفس اللحظة
const httpAgent = new https.Agent({ 
    keepAlive: true, 
    maxSockets: 60, 
    keepAliveMsecs: 30000 
});

const fastAxios = axios.create({
    httpsAgent: httpAgent,
    timeout: 5000 
});

// ==================== سيرفر الويب ====================
const app = express();
const PORT = process.env.PORT || 10000;
app.get('/', (req, res) => res.send('🚀 رادار الدسات السريع يعمل بنظام الأنابيب المفتوحة!'));
app.listen(PORT, () => console.log(`🌐 خادم الويب يعمل على المنفذ ${PORT}`));

// ==================== دوال الهجوم ====================

async function hitDislike(token, commentId, replyId) {
    const endpoints = WORKING_ENDPOINT ? [WORKING_ENDPOINT] : DISLIKE_ENDPOINTS_TO_TRY;

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
                console.log(`🎉 [اكتشاف] تم العثور على المسار الصحيح: ${endpoint}`);
                WORKING_ENDPOINT = endpoint;
            }
            return { success: true };

        } catch (error) {
            if (error.response?.status === 404) continue;
            if (error.response?.status === 400 || error.response?.status === 403) {
                if (!WORKING_ENDPOINT) {
                    console.log(`🎉 [اكتشاف] تم العثور على المسار الصحيح: ${endpoint}`);
                    WORKING_ENDPOINT = endpoint;
                }
                throw error;
            }
            throw error;
        }
    }
    throw new Error("جميع مسارات الديسلايك أعطت 404!");
}

async function attackReply(commentId, replyId, text, author) {
    // 🛡️ حماية صارمة لاسم ريّان
    if (author === SKIP_NAME) {
        console.log(`🛡️ [تخطي وحماية] الرد [${replyId}] للكاتب [${author}] محمي من الهجوم.`);
        return;
    }

    console.log(`⚔️  الهجوم بالدسات على [${author}] - رد: "${text.substring(0, 30)}..."`);

    // إرسال جميع الدسات في نفس اللحظة (نفس تكتيك اللايكات)
    const attackPromises = TOKENS.map(async (token, index) => {
        try {
            await hitDislike(token, commentId, replyId);
            console.log(`✅ [الحساب ${index + 1}]: ديسلايك بنجاح`);
        } catch (error) {
            console.error(`❌ [الحساب ${index + 1}]: فشل - ${error.response?.data?.detail || error.message}`);
        }
    });

    await Promise.all(attackPromises);
    console.log(`✅ انتهت موجة الدسات على الرد [${replyId}].`);
}

async function scanAndAttack() {
    if (isScanning) return;
    isScanning = true;

    try {
        if (processedReplies.size > 1000) {
            processedReplies.clear();
            console.log('🧹 [تنظيف] تم تفريغ الذاكرة.');
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
                        
                        // استخراج الاسم الدقيق
                        const authorName = reply.user_full_name || reply.user_name || 'مجهول';
                        
                        await attackReply(
                            commentId,
                            reply.anime_comment_reply_id,
                            reply.reply_text || '',
                            authorName
                        );
                    }));
                }
            } catch (err) {
                // تجاهل أخطاء الردود الفردية
            }
        }));

    } catch (error) {
        console.error('❌ خطأ أثناء دورة الفحص:', error.message);
    }

    isScanning = false;
}

function startLoop() {
    scanAndAttack().then(() => {
        // رجعنا السرعة لـ 25 ملي ثانية بناءً على قوة الكود!
        setTimeout(startLoop, 100); 
    });
}

console.log('🚀 تم تشغيل رادار الدسات (النسخة المدمرة القصوى)...');
console.log(`🛡️  الحماية مفعلة للاسم: ${SKIP_NAME}`);
startLoop();
