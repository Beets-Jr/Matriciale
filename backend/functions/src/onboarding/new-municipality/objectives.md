a organização do banco segue o exemplo, que no caso é um municipio chamado Palmares:

/municipio/Palmares/unidades/CAF

coleção municipio, dentro da qual há documentos, cada um sendo um município e seu nome sendo o id do documento. depois tem a coleção unidades, dentro dela cada documento tem o nome da unidade (no caso CAF). dentro de cada unidade tem a coleção de nome medicamentos_unidade, onde cada documento de id gerado pelo firebase contem as informações dos medicamentos especificos para aquela unidade.

considerar essa organização acima para inserção de novo municipio

meu objetivo aqui é ter um script que consiga lidar com a inserção de medicamentos em um municipio, o que diz respeito a campos como nome, codigo, classificacao, o tipo da unidade do medicamento e as movimentacoes semanais até então

o script deve ser dinamico, no sentido de que devo poder inserir o nome do municipio a ser inserido. o nome das unidades inseridas devem ser escritas manualmente em variaveis (um array de unidades com seus nomes), e o nome das abas correspondentes devem ser associados manualmente tambem.

deve exibir quantos documentos de cada unidade inseriu e salvar informacoes importantes em uma pasta chamada relatorios, em formato json de preferencia

//////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////
USAR COMO BASE O DO UPDATE MUCIPALITY Q TA BONITINHO
//////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////