import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/sales - Listar todas as vendas
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const userId = searchParams.get('userId')
    const cashRegisterId = searchParams.get('cashRegisterId')
    const paymentMethod = searchParams.get('paymentMethod')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const whereClause: any = {}
    
    if (status) {
      whereClause.status = status.toUpperCase()
    }
    if (userId) {
      whereClause.userId = userId
    }
    if (cashRegisterId) {
      whereClause.cashRegisterId = cashRegisterId
    }
    if (paymentMethod) {
      whereClause.paymentMethod = paymentMethod.toUpperCase()
    }
    if (startDate || endDate) {
      whereClause.createdAt = {}
      if (startDate) {
        whereClause.createdAt.gte = new Date(startDate)
      }
      if (endDate) {
        whereClause.createdAt.lte = new Date(endDate)
      }
    }

    const sales = await prisma.sale.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        cashRegister: {
          select: {
            id: true,
            status: true,
            createdAt: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(sales)
  } catch (error) {
    console.error('Erro ao buscar vendas:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST /api/sales - Criar nova venda
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { cashRegisterId, userId, items, total, paymentMethod, status = 'COMPLETED' } = body

    // Validações básicas
    if (!cashRegisterId || !userId || !items || !total || !paymentMethod) {
      return NextResponse.json(
        { error: 'Todos os campos são obrigatórios: cashRegisterId, userId, items, total, paymentMethod' },
        { status: 400 }
      )
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Items deve ser um array não vazio' },
        { status: 400 }
      )
    }

    if (isNaN(parseFloat(total)) || parseFloat(total) <= 0) {
      return NextResponse.json(
        { error: 'Total deve ser um número positivo' },
        { status: 400 }
      )
    }

    if (!['CASH', 'CARD', 'PIX'].includes(paymentMethod.toUpperCase())) {
      return NextResponse.json(
        { error: 'Método de pagamento deve ser CASH, CARD ou PIX' },
        { status: 400 }
      )
    }

    if (!['PENDING', 'COMPLETED', 'CANCELLED'].includes(status.toUpperCase())) {
      return NextResponse.json(
        { error: 'Status deve ser PENDING, COMPLETED ou CANCELLED' },
        { status: 400 }
      )
    }

    // Verificar se o usuário existe
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    // Verificar se a caixa registradora existe e está aberta
    const cashRegister = await prisma.cashRegister.findUnique({
      where: { id: cashRegisterId },
    })

    if (!cashRegister) {
      return NextResponse.json(
        { error: 'Caixa registradora não encontrada' },
        { status: 404 }
      )
    }

    if (cashRegister.status !== 'OPEN') {
      return NextResponse.json(
        { error: 'Caixa registradora deve estar aberta para realizar vendas' },
        { status: 409 }
      )
    }

    // Validar items
    for (const item of items) {
      if (!item.productId || !item.quantity || !item.price) {
        return NextResponse.json(
          { error: 'Cada item deve ter productId, quantity e price' },
          { status: 400 }
        )
      }

      if (isNaN(parseFloat(item.quantity)) || parseFloat(item.quantity) <= 0) {
        return NextResponse.json(
          { error: 'Quantidade deve ser um número positivo' },
          { status: 400 }
        )
      }

      if (isNaN(parseFloat(item.price)) || parseFloat(item.price) <= 0) {
        return NextResponse.json(
          { error: 'Preço deve ser um número positivo' },
          { status: 400 }
        )
      }
    }

    // Criar venda e atualizar valor atual da caixa
    const result = await prisma.$transaction(async (tx) => {
      // Criar venda
      const sale = await tx.sale.create({
        data: {
          cashRegisterId,
          userId,
          items,
          total: parseFloat(total),
          paymentMethod: paymentMethod.toUpperCase(),
          status: status.toUpperCase(),
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          cashRegister: {
            select: {
              id: true,
              status: true,
              currentAmount: true,
            },
          },
        },
      })

      // Atualizar valor atual da caixa se a venda foi completada
      if (status.toUpperCase() === 'COMPLETED') {
        await tx.cashRegister.update({
          where: { id: cashRegisterId },
          data: {
            currentAmount: {
              increment: parseFloat(total),
            },
          },
        })
      }

      return sale
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar venda:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}