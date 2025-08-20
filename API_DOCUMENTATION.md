# API Documentation - PDV Rafa

Esta documentação descreve todos os endpoints disponíveis na API do sistema PDV Rafa.

## Base URL
```
http://localhost:3000/api
```

## Endpoints

### Usuários

#### GET /api/users
Lista todos os usuários

**Resposta:**
```json
[
  {
    "id": "uuid",
    "email": "user@example.com",
    "name": "Nome do Usuário",
    "role": "USER",
    "active": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

#### POST /api/users
Cria um novo usuário

**Body:**
```json
{
  "email": "user@example.com",
  "name": "Nome do Usuário",
  "password": "senha123",
  "role": "USER" // opcional, padrão: USER
}
```

#### GET /api/users/[id]
Busca usuário por ID

#### PUT /api/users/[id]
Atualiza usuário

**Body:**
```json
{
  "email": "newemail@example.com", // opcional
  "name": "Novo Nome", // opcional
  "password": "novasenha123", // opcional
  "role": "ADMIN", // opcional
  "active": false // opcional
}
```

#### DELETE /api/users/[id]
Deleta usuário

---

### Produtos

#### GET /api/products
Lista todos os produtos

**Query Parameters:**
- `active`: true/false - filtra por produtos ativos

**Resposta:**
```json
[
  {
    "id": "uuid",
    "name": "Produto Exemplo",
    "description": "Descrição do produto",
    "price": 10.50,
    "imageUri": "https://example.com/image.jpg",
    "active": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

#### POST /api/products
Cria um novo produto

**Body:**
```json
{
  "name": "Nome do Produto",
  "description": "Descrição do produto", // opcional
  "price": 15.99,
  "imageUri": "https://example.com/image.jpg" // opcional
}
```

#### GET /api/products/[id]
Busca produto por ID

#### PUT /api/products/[id]
Atualiza produto

#### DELETE /api/products/[id]
Deleta produto

---

### Caixas Registradoras

#### GET /api/cash-registers
Lista todas as caixas registradoras

**Query Parameters:**
- `status`: OPEN/CLOSED - filtra por status
- `userId`: uuid - filtra por usuário

**Resposta:**
```json
[
  {
    "id": "uuid",
    "userId": "uuid",
    "status": "OPEN",
    "initialAmount": 100.00,
    "currentAmount": 150.00,
    "finalAmount": null,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "user": {
      "id": "uuid",
      "name": "Nome do Usuário",
      "email": "user@example.com"
    },
    "sales": []
  }
]
```

#### POST /api/cash-registers
Cria uma nova caixa registradora

**Body:**
```json
{
  "userId": "uuid",
  "initialAmount": 100.00 // opcional, padrão: 0
}
```

#### GET /api/cash-registers/[id]
Busca caixa registradora por ID

#### PUT /api/cash-registers/[id]
Atualiza caixa registradora

**Body:**
```json
{
  "status": "CLOSED", // opcional
  "currentAmount": 200.00, // opcional
  "finalAmount": 200.00 // opcional
}
```

#### DELETE /api/cash-registers/[id]
Deleta caixa registradora (apenas se não houver vendas)

---

### Vendas

#### GET /api/sales
Lista todas as vendas

**Query Parameters:**
- `status`: PENDING/COMPLETED/CANCELLED
- `userId`: uuid
- `cashRegisterId`: uuid
- `paymentMethod`: CASH/CARD/PIX
- `startDate`: YYYY-MM-DD
- `endDate`: YYYY-MM-DD

**Resposta:**
```json
[
  {
    "id": "uuid",
    "cashRegisterId": "uuid",
    "userId": "uuid",
    "items": [
      {
        "productId": "uuid",
        "productName": "Produto",
        "quantity": 2,
        "price": 10.00,
        "total": 20.00
      }
    ],
    "total": 20.00,
    "paymentMethod": "CASH",
    "status": "COMPLETED",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "user": {
      "id": "uuid",
      "name": "Nome do Usuário",
      "email": "user@example.com"
    },
    "cashRegister": {
      "id": "uuid",
      "status": "OPEN",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  }
]
```

#### POST /api/sales
Cria uma nova venda

**Body:**
```json
{
  "cashRegisterId": "uuid",
  "userId": "uuid",
  "items": [
    {
      "productId": "uuid",
      "productName": "Produto",
      "quantity": 2,
      "price": 10.00
    }
  ],
  "total": 20.00,
  "paymentMethod": "CASH",
  "status": "COMPLETED" // opcional, padrão: COMPLETED
}
```

#### GET /api/sales/[id]
Busca venda por ID

#### PUT /api/sales/[id]
Atualiza venda (apenas se a caixa estiver aberta)

#### DELETE /api/sales/[id]
Deleta venda (apenas se a caixa estiver aberta)

---

## Códigos de Status HTTP

- `200` - Sucesso
- `201` - Criado com sucesso
- `400` - Erro de validação
- `404` - Recurso não encontrado
- `409` - Conflito (ex: email já existe)
- `500` - Erro interno do servidor

## Exemplos de Uso

### Criar um usuário
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teste@example.com",
    "name": "Usuário Teste",
    "password": "senha123"
  }'
```

### Listar produtos ativos
```bash
curl http://localhost:3000/api/products?active=true
```

### Criar uma venda
```bash
curl -X POST http://localhost:3000/api/sales \
  -H "Content-Type: application/json" \
  -d '{
    "cashRegisterId": "uuid-da-caixa",
    "userId": "uuid-do-usuario",
    "items": [
      {
        "productId": "uuid-do-produto",
        "productName": "Coca-Cola 350ml",
        "quantity": 2,
        "price": 4.50
      }
    ],
    "total": 9.00,
    "paymentMethod": "CASH"
  }'
```