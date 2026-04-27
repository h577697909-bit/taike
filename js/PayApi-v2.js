// API基础配置
const config = {
    payUrl: 'https://api.nexusorch.com/Payment/Create', // 基础API地址
    centerUrl: 'https://www.roomilo.com/Pay/DoPay', //中转地址
    xApiId: 'test',
    apiKey: 'test',
    mchId: 'test',
    orderId: 'TEST',
    Env: 'TEST',
    customerId: 'test',
};

function DoRequest(data) {
    return (DoPay(data))();
}

/**
* 支付
* @param {Object} data - 支付数据
* @param {string} paymentData.amount - 金额
* @param {string} paymentData.currency - 货币代码
* @param {string} paymentData.payTypes - 支付类型
* @param {string} paymentData.email - 邮箱
* @param {string} paymentData.firstName - FirstName
* @param {string} paymentData.lastName - LastName
* @param {string} paymentData.orderId - LastName
* @param {string} paymentData.name - 商品名称
* @param {string} paymentData.successUrl - 成功跳转地址
* @param {string} paymentData.backUrl - 失败跳转地址
* @returns {Promise<Object>} 支付结果
*/
async function DoPay(data = {}) {
    let timestamp = Math.floor(Date.now() / 1000).toString();

    // 步骤1：选取字段
    const rawParams = {
        merchantId: config.mchId,
        orderId: data.orderId,
        amount: data.amount,
        currency: data.currency,
        timestamp: timestamp
    };

    // 步骤2：字典序排序 + 下划线拼接 + 小写
    const sortedKeys = Object.keys(rawParams).sort(); // 按字母 A-Z 排序
    const kvPairs = sortedKeys.map(key => {
        return `${key}=${rawParams[key]}`.toLowerCase();
    });
    const signString = kvPairs.join('&');

    // 步骤3：加密
    const signature = CryptoJS.HmacSHA256(signString, config.apiKey).toString();
    const product = [];
    product.push({
        Name: data.name,
        UnitPrice: data.amount,
        Quantity: 1,
        ProductId: 'GP001',
        SkuCode: 'GP001'
    });

    // --- 构建完整请求对象 ---
    const fullPayload = {
        MerchantId: config.mchId,
        OrderId: data.orderId,
        Timestamp: timestamp,

        TotalAmount: parseFloat(data.amount),
        ShippingFee: 0,
        CustomerId: config.customerId,
        Currency: data.currency,
        Env: config.Env,
        Email: data.email,
        FirstName: data.firstName,
        LastName: data.lastName,
        Phone: data.phone,

        PayTypes: data.payTypes,
        Domain: "https://",
        Signature: signature,
        Products: product,

        BillFirstName: data.firstName,

        NotifyUrl: '',
        successUrl:'https://www.test.com', //成功后跳转地址
        backUrl:'https://www.failed.com', //失败后跳转地址
        SignType: 'HMAC-SHA256',

        ProductsType: 'digital_goods',
        ClientIp: '',
        UserAgent: '',
    };
    var finalPayload = JSON.stringify(fullPayload, null, 4);

    try {
        const response = await fetch(config.centerUrl, {
            method: 'POST',
            mode: 'cors',
            redirect: 'follow',
            headers: {
                'Content-Type': 'application/json',
                'x-api-id': config.xApiId,
                'x-domain': config.payUrl
            },
            body: finalPayload
        });
        var rawresponse = await response.text();;
        var reinfo = JSON.parse(rawresponse);
        if (reinfo.statusCodes == 1) {
            window.location = reinfo.data.normalUrl;
        } else {
            throw reinfo.error;
        }

    } catch (error) {
        throw error;
    }

    return {
        success: false,
        transactionId: ``,
        amount: data.amount,
        currency: data.currency,
        timestamp: new Date().toISOString()
    };
}