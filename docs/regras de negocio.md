# Tela de configuração

    Equipamento: neste sub item deve ter
        -  Essas configurações aplicadas para todos os equipamentos.
        - Na tela de configuração deve ter um sub item para configura qual regra deve ser aplicada para locação por semana, quinzena e mês, baseado no valor da diaria do equipamento. A seleção desse valor deve ser sugestivo permitindo o usuario inputar um valor manualmente.

    Global: neste sub item deve ter
            - Deve ter uma seleção de moeda a ser usada no app como real, dólar ou euro, que será exibida no PDF exportavel. O padrão deve ser real.
            <!-- - Deve permitir selecionar o idioma do app, com opções para português e inglês. O Padrão deve ser português. -->
            <!-- - O idioma selecionado deve ser aplicado em todo o app, incluindo os textos exibidos no PDF exportavel. -->
    - Empresa:  neste sub item deve ter
        - Permitir colocar o nome da empresa, que será exibido no PDF exportavel.
        - Permitir selecionar uma imagem como logo da empresa, que será exibido no PDF exportavel.
        - Deve permitir colocar o cpf/cnpj da empresa.

    - Notificação: neste sub item deve ter
        - Permitir configurar notificações para lembrar o usuário sobre o inicio e término das locações, com opções de tempo para receber a notificação (ex: 1 dia antes, 1 hora antes, etc).

# Tela de cadastro de equipamento

    Deve ter uma seleção de modade de locação, onde o usuário irá selecionar a modalidade de locação do equipamento por diária, semanal, quinzenal ou mensal. O valor da locação do equipamento será calculado automaticamente com base na regra definida na tela de configuração.

    Deve permitir registar o valor do equipamento

# Tela de cadastro de locação

    - O usuário deve selecionar o cliente por um select, o equipamento por um select, a data de início e a data de término da locação.
    - Deve permitir selecionar a modalidade de entrega ou retirada do equipamento.
    - Caso a modalidade seja entrega, deve permitir selecionar o endereço de entrega, e colocar o valor do frete, que será adicionado ao valor total da locação.
    - Caso não houver equipamentos cadastrados, deve mostrar um breve aviso no espaço onde a lista de equipamentos seria exibida, para o usuário cadastrar um equipamento antes de criar uma locação.
       - Deve mostrar um botão para o usuário ir direto para a tela de cadastro de equipamento, facilitando o processo de cadastro e criação de locação.
       - Deve salvar os dados já preenchidos na tela de cadastro de locação, para que o usuário não perca as informações inseridas ao ser redirecionado para a tela de cadastro de equipamento.
    - Caso não houver clientes cadastrados, deve mostrar um breve aviso no espaço onde a lista de clientes seria exibida, para o usuário cadastrar um cliente antes de criar uma locação.
         - Deve mostrar um botão para o usuário ir direto para a tela de cadastro de cliente, facilitando o processo de cadastro e criação de locação.
         - Deve salvar os dados já preenchidos na tela de cadastro de locação, para que o usuário não perca as informações inseridas ao ser redirecionado para a tela de cadastro de cliente.
    - Deve permitir editar uma locação já criada, permitindo alterar o cliente, equipamento, data de início, data de término, modalidade de entrega ou retirada, endereço de entrega e valor do frete.
    - Deve permitir selecionar o status da locação, como "Em Andamento", "Concluído", "Cancelada" e "Orçamento".
    - Em caso de orçamento deve ter um campo para validade do orçamento, onde o usuário deve selecionar a data de validade do orçamento, e o app deve considerar como cancelado o orçamento que ultrapassar a data de validade sem ser convertido no status de "concluído", e deve mostrar um aviso para o usuário sobre a expiração do orçamento.

# Regas do APP

    - O formato de data deve ser dia/mês/ano, e o formato de hora deve ser hora:minuto.
