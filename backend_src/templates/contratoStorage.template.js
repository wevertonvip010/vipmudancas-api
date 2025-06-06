/**
 * Template de Contrato de Locação para Self Storage
 * Baseado nas práticas da Associação Brasileira de Self Storage (ABSS)
 * e na legislação brasileira vigente
 */

const contratoStorageTemplate = `
# CONTRATO DE LOCAÇÃO DE ESPAÇO PARA SELF STORAGE

## IDENTIFICAÇÃO DAS PARTES

**LOCADOR**: VIP STORAGE GUARDA DE BENS E MUDANÇAS, pessoa jurídica de direito privado, inscrita no CNPJ sob nº {{cnpj_locador}}, com sede na {{endereco_locador}}, neste ato representada na forma de seu contrato social, doravante denominada simplesmente "LOCADOR" ou "VIP STORAGE".

**LOCATÁRIO**: {{nome_locatario}}, {{tipo_pessoa}} de direito {{tipo_direito}}, {{tipo_documento}} nº {{numero_documento}}, residente e domiciliado na {{endereco_locatario}}, doravante denominado simplesmente "LOCATÁRIO" ou "CLIENTE".

As partes acima identificadas têm, entre si, justo e acertado o presente Contrato de Locação de Espaço para Self Storage, que se regerá pelas cláusulas e condições seguintes:

## CLÁUSULA PRIMEIRA - DEFINIÇÕES

Para os fins deste contrato, consideram-se:

1.1. **Box/Espaço**: unidade individualizada de armazenamento identificada como Box {{numero_box}}, com dimensões de {{altura_box}}m de altura, {{largura_box}}m de largura e {{profundidade_box}}m de profundidade, totalizando {{metragem_quadrada}}m², localizado no {{andar_box}} do imóvel situado na {{endereco_imovel}}.

1.2. **Self Storage**: modalidade de locação de espaço individualizado e privativo destinado exclusivamente para guarda e armazenamento de bens e mercadorias.

1.3. **Regulamento Interno**: conjunto de normas que disciplinam o uso, funcionamento, acesso e segurança do espaço, que faz parte integrante deste contrato.

## CLÁUSULA SEGUNDA - OBJETO

2.1. O presente contrato tem por objeto a locação do Box/Espaço acima descrito, que o LOCATÁRIO declara receber em perfeitas condições de uso, limpeza e conservação.

2.2. O Box/Espaço será utilizado exclusivamente pelo LOCATÁRIO para armazenamento de bens e mercadorias, sendo expressamente proibida a utilização para outros fins, tais como:
   a) Moradia humana ou animal;
   b) Estabelecimento comercial ou escritório;
   c) Realização de reuniões ou eventos;
   d) Produção, fabricação ou montagem de produtos;
   e) Qualquer atividade ilícita ou que viole a legislação vigente.

2.3. É expressamente proibido o armazenamento dos seguintes itens:
   a) Materiais inflamáveis, explosivos, tóxicos ou perigosos;
   b) Substâncias ilícitas ou controladas sem a devida autorização;
   c) Alimentos perecíveis ou que possam atrair pragas;
   d) Animais vivos ou mortos;
   e) Plantas ou materiais orgânicos sujeitos a decomposição;
   f) Armas e munições sem o devido registro e autorização;
   g) Bens de origem ilícita ou produtos contrabandeados;
   h) Qualquer item que possa causar danos ao Box/Espaço ou às áreas comuns.

## CLÁUSULA TERCEIRA - PRAZO

3.1. O presente contrato tem prazo inicial de {{prazo_contrato}} meses, com início em {{data_inicio}} e término em {{data_termino}}, podendo ser renovado automaticamente por iguais períodos, caso nenhuma das partes se manifeste em contrário com antecedência mínima de 7 (sete) dias do término do período vigente.

3.2. O LOCATÁRIO poderá rescindir o contrato a qualquer momento, mediante notificação por escrito com antecedência mínima de 15 (quinze) dias, ficando obrigado ao pagamento proporcional do aluguel até a data da efetiva desocupação do Box/Espaço.

## CLÁUSULA QUARTA - VALOR E FORMA DE PAGAMENTO

4.1. O LOCATÁRIO pagará ao LOCADOR, a título de aluguel, o valor mensal de R$ {{valor_mensal}} ({{valor_mensal_extenso}}), calculado com base no valor de R$ {{valor_metro_quadrado}} por metro quadrado.

4.2. O pagamento será efetuado mensalmente, todo dia {{dia_pagamento}} de cada mês, mediante boleto bancário emitido pelo sistema Cora, que será enviado ao e-mail cadastrado pelo LOCATÁRIO com antecedência mínima de 5 (cinco) dias da data de vencimento.

4.3. O valor do aluguel será reajustado anualmente, ou na menor periodicidade permitida por lei, com base na variação do IGPM/FGV, ou outro índice que venha a substituí-lo.

4.4. Em caso de atraso no pagamento, incidirá sobre o valor devido:
   a) Multa de 2% (dois por cento);
   b) Juros de mora de 1% (um por cento) ao mês, calculados pro rata die;
   c) Correção monetária com base no IGPM/FGV.

4.5. O não pagamento do aluguel por período superior a 30 (trinta) dias autorizará o LOCADOR a:
   a) Restringir o acesso do LOCATÁRIO ao Box/Espaço;
   b) Rescindir o contrato;
   c) Promover a venda dos bens armazenados para quitação do débito, nos termos da Cláusula Oitava.

## CLÁUSULA QUINTA - ACESSO E SEGURANÇA

5.1. O LOCATÁRIO terá acesso ao Box/Espaço nos seguintes horários: {{horario_acesso}}, mediante identificação e cumprimento dos procedimentos de segurança estabelecidos no Regulamento Interno.

5.2. O LOCATÁRIO receberá {{quantidade_chaves}} chave(s) e/ou dispositivo(s) de acesso, sendo de sua exclusiva responsabilidade a guarda e conservação. Em caso de perda, extravio ou dano, o LOCATÁRIO deverá comunicar imediatamente o LOCADOR e arcar com os custos de substituição.

5.3. O LOCATÁRIO poderá autorizar terceiros a acessar o Box/Espaço, mediante comunicação prévia e por escrito ao LOCADOR, permanecendo, no entanto, integralmente responsável pelos atos praticados por seus prepostos.

5.4. O LOCADOR não terá acesso ao interior do Box/Espaço, exceto nas seguintes hipóteses:
   a) Em caso de emergência que possa causar danos ao Box/Espaço, às áreas comuns ou a terceiros;
   b) Por determinação judicial ou de autoridade competente;
   c) Em caso de inadimplência superior a 30 (trinta) dias, para fins de inventário e eventual venda dos bens;
   d) Mediante autorização expressa do LOCATÁRIO.

## CLÁUSULA SEXTA - RESPONSABILIDADES

6.1. O LOCATÁRIO é o único e exclusivo responsável pelos bens armazenados no Box/Espaço, declarando-se ciente de que o LOCADOR não tem conhecimento da natureza, valor ou importância dos itens depositados.

6.2. O LOCADOR não se responsabiliza por danos, furtos, roubos, avarias, deterioração natural ou quaisquer outros prejuízos causados aos bens armazenados, salvo se comprovadamente decorrentes de falha na segurança ou estrutura do imóvel.

6.3. Recomenda-se ao LOCATÁRIO a contratação de seguro para os bens armazenados, sendo esta uma decisão facultativa e de sua exclusiva responsabilidade.

6.4. O LOCATÁRIO é responsável por:
   a) Manter o Box/Espaço limpo e em boas condições;
   b) Comunicar imediatamente ao LOCADOR qualquer dano ou problema estrutural no Box/Espaço;
   c) Respeitar as normas de segurança e o Regulamento Interno;
   d) Não realizar modificações ou benfeitorias no Box/Espaço sem prévia autorização por escrito do LOCADOR;
   e) Utilizar o Box/Espaço exclusivamente para os fins previstos neste contrato.

6.5. O LOCADOR é responsável por:
   a) Manter a estrutura do imóvel em boas condições;
   b) Garantir o acesso do LOCATÁRIO ao Box/Espaço nos horários estabelecidos;
   c) Implementar e manter sistemas de segurança adequados;
   d) Fornecer ao LOCATÁRIO todas as informações necessárias para o uso adequado do Box/Espaço.

## CLÁUSULA SÉTIMA - RESCISÃO

7.1. O presente contrato poderá ser rescindido nas seguintes hipóteses:
   a) Por acordo entre as partes;
   b) Pelo término do prazo contratual, sem renovação;
   c) Por iniciativa do LOCATÁRIO, mediante notificação prévia de 15 (quinze) dias;
   d) Por iniciativa do LOCADOR, em caso de inadimplência superior a 30 (trinta) dias;
   e) Por descumprimento de qualquer cláusula contratual ou do Regulamento Interno;
   f) Por uso indevido do Box/Espaço ou armazenamento de itens proibidos.

7.2. Em caso de rescisão, o LOCATÁRIO deverá:
   a) Retirar todos os seus bens do Box/Espaço;
   b) Devolver o Box/Espaço nas mesmas condições em que o recebeu;
   c) Quitar eventuais débitos pendentes;
   d) Devolver as chaves e/ou dispositivos de acesso.

7.3. Caso o LOCATÁRIO não retire seus bens após o término ou rescisão do contrato, o LOCADOR poderá:
   a) Cobrar o valor proporcional do aluguel pelo período adicional;
   b) Após 30 (trinta) dias, remover os bens e armazená-los em outro local, às expensas do LOCATÁRIO;
   c) Após 60 (sessenta) dias, proceder conforme a Cláusula Oitava.

## CLÁUSULA OITAVA - GARANTIA DE PAGAMENTO

8.1. Em caso de inadimplência superior a 30 (trinta) dias, o LOCATÁRIO autoriza expressamente o LOCADOR a:
   a) Restringir seu acesso ao Box/Espaço;
   b) Inventariar os bens armazenados, na presença de duas testemunhas;
   c) Após 60 (sessenta) dias de inadimplência, promover a venda dos bens para quitação do débito, mediante notificação prévia.

8.2. O produto da venda será utilizado para:
   a) Quitar o débito existente, incluindo aluguéis, multas, juros e despesas com a venda;
   b) O saldo remanescente, se houver, ficará à disposição do LOCATÁRIO pelo prazo de 1 (um) ano.

8.3. Esta cláusula constitui pacto comissório legal, nos termos do artigo 1.433, inciso IV, do Código Civil Brasileiro.

## CLÁUSULA NONA - NOTIFICAÇÕES

9.1. Todas as notificações e comunicações relacionadas a este contrato serão consideradas válidas quando enviadas para os seguintes endereços:
   a) LOCADOR: {{email_locador}} / {{telefone_locador}}
   b) LOCATÁRIO: {{email_locatario}} / {{telefone_locatario}}

9.2. É responsabilidade das partes manter seus dados de contato atualizados.

## CLÁUSULA DÉCIMA - DISPOSIÇÕES GERAIS

10.1. O presente contrato vincula as partes e seus sucessores a qualquer título.

10.2. O Regulamento Interno é parte integrante deste contrato, declarando o LOCATÁRIO ter recebido uma cópia e estar de acordo com seus termos.

10.3. A tolerância de qualquer das partes quanto ao descumprimento de qualquer cláusula deste contrato não implicará novação ou renúncia de direitos.

10.4. Os casos omissos serão resolvidos de comum acordo entre as partes, com base na legislação vigente.

10.5. O LOCATÁRIO autoriza o LOCADOR a utilizar seus dados pessoais exclusivamente para os fins relacionados a este contrato, em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018).

## CLÁUSULA DÉCIMA PRIMEIRA - FORO

11.1. As partes elegem o Foro da Comarca de {{comarca}} para dirimir quaisquer dúvidas ou litígios decorrentes deste contrato, com renúncia expressa a qualquer outro, por mais privilegiado que seja.

E, por estarem assim justas e contratadas, as partes assinam o presente instrumento em 2 (duas) vias de igual teor e forma, na presença das testemunhas abaixo.

{{cidade}}, {{data_assinatura}}.

___________________________________
VIP STORAGE GUARDA DE BENS E MUDANÇAS
LOCADOR

___________________________________
{{nome_locatario}}
LOCATÁRIO

TESTEMUNHAS:

1. ___________________________________
Nome:
CPF:

2. ___________________________________
Nome:
CPF:
`;

module.exports = contratoStorageTemplate;
