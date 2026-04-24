export const smsConfig = {
  accessKeyId: process.env.ALIYUN_ACCESS_KEY_ID || '',
  accessKeySecret: process.env.ALIYUN_ACCESS_KEY_SECRET || '',
  signName: process.env.ALIYUN_SMS_SIGN_NAME || '',
  templateCode: process.env.ALIYUN_SMS_TEMPLATE_CODE || '',
  regionId: process.env.ALIYUN_REGION_ID || 'cn-hangzhou',
  endpoint: process.env.ALIYUN_SMS_ENDPOINT || 'pnsapi.aliyuncs.com',
};

export const smsValidation = {
  codeLength: 6,
  codeExpiry: 5 * 60 * 1000, // 5分钟过期
  maxAttempts: 3, // 最大尝试次数
};