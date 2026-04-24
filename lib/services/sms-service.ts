import { smsConfig, smsValidation } from '../config/sms-config';
import Dypnsapi, * as $Dypnsapi from '@alicloud/dypnsapi20170525';
import OpenApi, * as $OpenApi from '@alicloud/openapi-client';

interface SmsResult {
  success: boolean;
  message: string;
  code?: string;
  requestId?: string;
}

function createClient(): Dypnsapi {
  const config = new $OpenApi.Config({
    accessKeyId: smsConfig.accessKeyId,
    accessKeySecret: smsConfig.accessKeySecret,
  });
  return new Dypnsapi(config);
}

export const SmsService = {
  async sendSmsVerifyCode(phone: string): Promise<SmsResult> {
    try {
      const client = createClient();
      const request = new $Dypnsapi.SendSmsVerifyCodeRequest({
        phoneNumber: phone,
        signName: smsConfig.signName,
        templateCode: smsConfig.templateCode,
        codeLength: smsValidation.codeLength.toString(),
        validTime: (smsValidation.codeExpiry / 1000).toString(),
        codeType: '1',
        returnVerifyCode: true,
        duplicatePolicy: '1',
        interval: '60',
        templateParam: JSON.stringify({ code: '##code##', min: '5' }),
      });

      const response = await client.sendSmsVerifyCode(request);
      console.log('阿里云 API 完整响应:', response);
      
      if (response.body?.code === 'OK') {
        return {
          success: true,
          message: '短信发送成功',
          code: response.body.verifyCode,
          requestId: response.body.requestId
        };
      } else {
        return {
          success: false,
          message: response.body?.message || '短信发送失败',
          code: response.body?.code,
        };
      }
    } catch (error) {
      console.error('发送短信失败:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : '短信发送失败',
      };
    }
  },

  async checkSmsVerifyCode(phone: string, verifyCode: string): Promise<{ valid: boolean; message: string }> {
    try {
      const client = createClient();
      const request = new $Dypnsapi.CheckSmsVerifyCodeRequest({
        phoneNumber: phone,
        smsCode: verifyCode,
      });
      
      const response = await client.checkSmsVerifyCode(request);
      console.log('阿里云 API 完整响应:', response);
      
      if (response.body?.code === 'OK') {
        return { valid: true, message: '验证成功' };
      } else {
        return { valid: false, message: response.body?.message || '验证失败' };
      }
    } catch (error) {
      console.error('验证码核验失败:', error);
      return {
        valid: false,
        message: error instanceof Error ? error.message : '验证失败',
      };
    }
  },
};