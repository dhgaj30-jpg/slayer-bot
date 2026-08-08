const axios = require('axios');
const express = require('express');
const https = require('https'); 

// ==================== الإعدادات الأساسية l====================
const MAIN_BASE_URL = 'https://anslayer.com/anime/public/anime-comments/';
const CLIENT_ID = 'android-app2';
const CLIENT_SECRET = '7befba6263cc14c90d2f1d6da2c5cf9b251bfbbd';

// توكنات الدسات الخاصة بك (10 حسابات)
const TOKENS = [
    'aea36acf58fb783ee9fbe7ad1549709b330d11d2', // rakanjamalrj21
    '220b4c0f99e4c484fe7c518450e13366d72de2ec', // daloop101d
    '14d40bc15d019ee42b8ad22e36586ff85d47d38a', // sem80142
    'd10f1626cc91e4f6c5b90671dbd52a2377092be2', // rayanjamalderar
    '37f54f7e301c60b36f214e6c67b088555042d017', // derar4jamal
    '27ec5260282859683a58e00a4d1a97a4daaf939a', // dryj2008
    '33d2c1a077f0281ecf3950170ef3ce6a461a7f08', // baraskyr
    '5899bd55f346b9048ff65342913c658066e03676', // drarjmal511
    'c76c37baf136e888586e85862d6bc164f6fba87c', // polahr1292
    '7e760bd74826674720b24e012f9d8f561515c8c9', // fshl72990
    '59a5bb39862317e9aed2c543d5851f346d3a4fd5', // hdhe8707
    '8b5274dbadc627e923c656ae5f7be5204fe3e2ee', // dysd5042
    'c91cdd271f02468bc6b1a611a7b647703a31c560', // dalob5655
    '8657137866d1d2f2b1458e69c6f20984c04731ca', // harwnalnzy544
    'b1ac3b6e20e65a63009fb36c31b43d018b81e787', // kft76021
    'b896727da1397c2216b0a68ddd79881ce951983e', // xvjd0530
    '88df8d9388209d5ab97c120c49fd6ca71ceecb29', // shhe6674
    '744ee1798ea4317bf9dd4dc2ecf39961337e2ee8', // sekdshjs
    'c8c90bbeef1227f0b083f1ecb1c9593b22c7e22a', // sbow871
    '632d0c4b5c24b1764f326fb05258121bdb66b1dd', // sggs8700
    '58b4dee8f6a2e5e1bb2e37557acccfaad5ba561d', // xbef1124
    '92396b80fa4f6383a031a1e13aa0ba855ef5cbed', // hdjf7199
    'a0b0a0f92fb775533c50b5e1f88d29e5806b9ea4', // sjheikw
    '5bc8de94bf5031d5d6f673cfe936139b7cdec677', // byg22348
    'bcacd28f2b97309eeb53c955d372d31734aa2f03', // kdnw880
    '6a2fd615edfd44a98843b1597bdea5973456ab33', // jehu05971
    '13a00af3523f3e8ff0d8469c9ad4d0e822e220f2', // difl65789
    'db5f7cc02b423e988d445739776ffbeebd9786cf', // jhbn70905
    '8f418427b54106fe5808ab9c06ac9b530341673a', // rpot14066
    '00c986418a36123625c7bf742b8832dc524a80c5', // rayanjamalrj21
    '69adc573ad676acbf6e67ccbb3bcb3785f4b5ab4', // norahjamal511
    '7dcecbe38e81eb93c0d96df24d0616e99d1f2bbf', // offlod9
    '6d17ef7f5fab602d91361860017f3415a15814da', // rayanderarjamal
    'a6a23cdbae707bf9977af78ba0d4cd2eb298e4dc', // jsbdhddj0
    'dc0ced10bb1a40e4add562c7b39916a89d9cc130',
    '44d665eae5f63a5d12f89d9cd802545cde9f9317',
    '472cb3c672d065ea8b994dc33eae6d3e35abf280',
    '00fc00af05795beffd0dd9cc825b23cc9e661926',
    '2af0f99708b6db9d93a8baecd28c9048a4d3a4a8'
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

        const topComments = commentsList.slice(0, 1);

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
