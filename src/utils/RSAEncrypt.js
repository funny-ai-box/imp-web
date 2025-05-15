import { JSEncrypt } from 'jsencrypt';

// RSA加密工具
class RSAEncrypt {
  constructor() {
    this.publicKey = null;
    this.jsEncrypt = new JSEncrypt();
  }

  // 设置公钥
  setPublicKey(publicKey) {
    this.publicKey = publicKey;
    this.jsEncrypt.setPublicKey(publicKey);
  }

  // 使用公钥加密
  encrypt(text) {
    if (!this.publicKey) {
      throw new Error('公钥未设置，无法加密');
    }
    
    const encrypted = this.jsEncrypt.encrypt(text);
    if (encrypted === false) {
      throw new Error('加密失败');
    }
    
    return encrypted;
  }

  // 检查是否已设置公钥
  hasPublicKey() {
    return !!this.publicKey;
  }
}

// 创建单例实例
const rsaEncrypt = new RSAEncrypt();

export default rsaEncrypt;