import { smsConfig, smsValidation } from '../config/sms-config';
import Dypnsapi, * as $Dypnsapi from '@alicloud/dypnsapi20170525';
import OpenApi, * as $OpenApi from '@alicloud/openapi-client';

interface SmsResult {
  success: boolean;
  message: string;
  code?: string;
  requestId?: string;
}

/** 模块级单例，避免每次请求重新初始化 SDK 客户端。 */
let _client: Dypnsapi | null = null;

function getClient(): Dypnsapi {
  if (!_client) {
    const config = new $OpenApi.Config({
      accessKeyId: smsConfig.accessKeyId,
      accessKeySecret: smsConfig.accessKeySecret,
    });
    _client = new Dypnsapi(config);
  }
  return _client;
}

export const SmsService = {
  async sendSmsVerifyCode(phone: string): Promise<SmsResult> {
    try {
      const client = getClient();
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

      if (response.body?.code === 'OK') {
        return {
          success: true,
          message: '短信发送成功',
          code: response.body.verifyCode,
          requestId: response.body.requestId,
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

  async checkSmsVerifyCode(
    phone: string,
    verifyCode: string,
  ): Promise<{ valid: boolean; message: string }> {
    try {
      const client = getClient();
      const request = new $Dypnsapi.CheckSmsVerifyCodeRequest({
        phoneNumber: phone,
        verifyCode: verifyCode,
        caseAuthPolicy: 1,
        countryCode: '86',
        outId: 'driver-trip-log-system',
      });

      const response = await client.checkSmsVerifyCode(request);

      if (response.body?.code === 'OK') {
        const verifyResult = response.body.model?.verifyResult;
        if (verifyResult === 'PASS') {
          return { valid: true, message: '验证成功' };
        } else {
          return { valid: false, message: '验证码不正确或已过期' };
        }
      } else {
        return {
          valid: false,
          message: response.body?.message || '验证失败',
        };
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
