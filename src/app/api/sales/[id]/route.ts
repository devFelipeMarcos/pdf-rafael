import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/sales/[id] - Buscar venda por ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const sale = await prisma.sale.findUnique({
      where: { id },
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
            initialAmount: true,
            currentAmount: true,
            createdAt: true,
          },
        },
      },
    })

    if (!sale) {
      return NextResponse.json(
        { error: 'Venda não encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json(sale)
  } catch (error) {
    console.error('Erro ao buscar venda:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// PUT /api/sales/[id] - Atualizar venda
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()
    const { items, total, paymentMethod, status } = body

    // Verificar se a venda existe
    const existingSale = await prisma.sale.findUnique({
      where: { id },
      include: {
        cashRegister: true,
      },
    })

    if (!existingSale) {
      return NextResponse.json(
        { error: 'Venda não encontrada' },
        { status: 404 }
      )
    }

    // Verificar se a caixa ainda está aberta para modificações
    if (existingSale.cashRegister.status !== 'OPEN') {
      return NextResponse.json(
        { error: 'Não é possível modificar vendas de caixas fechadas' },
        { status: 409 }
      )
    }

    // Preparar dados para atualização
    const updateData: any = {}
    let totalDifference = 0

    if (items !== undefined) {
      if (!Array.isArray(items) || items.length === 0) {
        return NextResponse.json(
          { error: 'Items deve ser um array não vazio' },
          { status: 400 }
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

      updateData.items = items
    }

    if (total !== undefined) {
      if (isNaN(parseFloat(total)) || parseFloat(total) <= 0) {
        return NextResponse.json(
          { error: 'Total deve ser um número positivo' },
          { status: 400 }
        )
      }
      
      // Calcular diferença para atualizar caixa
      if (existingSale.status === 'COMPLETED') {
        totalDifference = parseFloat(total) - parseFloat(existingSale.total.toString())
      }
      
      updateData.total = parseFloat(total)
    }

    if (paymentMethod !== undefined) {
      if (!['CASH', 'CARD', 'PIX'].includes(paymentMethod.toUpperCase())) {
        return NextResponse.json(
          { error: 'Método de pagamento deve ser CASH, CARD ou PIX' },
          { status: 400 }
        )
      }
      updateData.paymentMethod = paymentMethod.toUpperCase()
    }

    if (status !== undefined) {
      if (!['PENDING', 'COMPLETED', 'CANCELLED'].includes(status.toUpperCase())) {
        return NextResponse.json(
          { error: 'Status deve ser PENDING, COMPLETED ou CANCELLED' },
          { status: 400 }
        )
      }
      
      const newStatus = status.toUpperCase()
      const oldStatus = existingSale.status
      
      // Calcular diferença para atualizar caixa baseado na mudança de status
      if (oldStatus === 'COMPLETED' && newStatus !== 'COMPLETED') {
        // Removendo venda completada
        totalDifference = -parseFloat(existingSale.total.toString())
      } else if (oldStatus !== 'COMPLETED' && newStatus === 'COMPLETED') {
        // Adicionando venda completada
        const saleTotal = updateData.total !== undefined ? updateData.total : parseFloat(existingSale.total.toString())
        totalDifference = saleTotal
      }
      
      updateData.status = newStatus
    }

    // Atualizar venda e caixa em transação
    const result = await prisma.$transaction(async (tx) => {
      // Atualizar venda
      const sale = await tx.sale.update({
        where: { id },
        data: updateData,
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

      // Atualizar valor da caixa se necessário
      if (totalDifference !== 0) {
        await tx.cashRegister.update({
          where: { id: existingSale.cashRegisterId },
          data: {
            currentAmount: {
              increment: totalDifference,
            },
          },
        })
      }

      return sale
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Erro ao atualizar venda:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// DELETE /api/sales/[id] - Deletar venda
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // Verificar se a venda existe
    const existingSale = await prisma.sale.findUnique({
      where: { id },
      include: {
        cashRegister: true,
      },
    })

    if (!existingSale) {
      return NextResponse.json(
        { error: 'Venda não encontrada' },
        { status: 404 }
      )
    }

    // Verificar se a caixa ainda está aberta
    if (existingSale.cashRegister.status !== 'OPEN') {
      return NextResponse.json(
        { error: 'Não é possível deletar vendas de caixas fechadas' },
        { status: 409 }
      )
    }

    // Deletar venda e ajustar caixa em transação
    await prisma.$transaction(async (tx) => {
      // Se a venda estava completada, remover valor da caixa
      if (existingSale.status === 'COMPLETED') {
        await tx.cashRegister.update({
          where: { id: existingSale.cashRegisterId },
          data: {
            currentAmount: {
              decrement: parseFloat(existingSale.total.toString()),
            },
          },
        })
      }

      // Deletar venda
      await tx.sale.delete({
        where: { id },
      })
    })

    return NextResponse.json(
      { message: 'Venda deletada com sucesso' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Erro ao deletar venda:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}