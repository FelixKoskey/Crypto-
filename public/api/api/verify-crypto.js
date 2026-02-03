const fetch = require('node-fetch');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        const { amount } = req.body;
        const address = process.env.USDT_ADDRESS || 'TK4rUz6TUEd7zCWeuiX5R47pSNdPswJnAc';

        console.log('🔍 CHECKING BLOCKCHAIN:', {
            expectedAmount: amount,
            wallet: address
        });

        const response = await fetch(
            `https://apilist.tronscanapi.com/api/token_trc20/transfers?limit=20&start=0&toAddress=${address}&tokenAddress=TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t`
        );

        const data = await response.json();

        if (data.token_transfers && data.token_transfers.length > 0) {
            const thirtyMinutesAgo = Date.now() - (30 * 60 * 1000);

            for (let tx of data.token_transfers) {
                if (tx.block_timestamp > thirtyMinutesAgo) {
                    const receivedAmount = parseFloat(tx.quant) / 1000000;

                    console.log('💰 FOUND TX:', {
                        hash: tx.transaction_id,
                        amount: receivedAmount,
                        expected: amount
                    });

                    if (Math.abs(receivedAmount - amount) < (amount * 0.01)) {
                        console.log('✅✅✅ USDT PAYMENT CONFIRMED!');

                        return res.status(200).json({
                            success: true,
                            transactionHash: tx.transaction_id,
                            amount: receivedAmount,
                            timestamp: tx.block_timestamp,
                            from: tx.from_address
                        });
                    }
                }
            }
        }

        console.log('⏳ No matching transaction found');

        return res.status(200).json({
            success: false,
            message: 'No matching transaction found'
        });

    } catch (error) {
        console.error('❌ Crypto Verification Error:', error);
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
};
