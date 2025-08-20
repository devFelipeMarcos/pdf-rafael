import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/cash-registers/[id] - Buscar caixa registradora por ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const cashRegister = await prisma.cashRegister.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        sales: {
          select: {
            id: true,
            total: true,
            paymentMethod: true,
            status: true,
            items: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    })

    if (!cashRegister) {
      return NextResponse.json(
        { error: 'Caixa registradora não encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json(cashRegister)
  } catch (error) {
    console.error('Erro ao buscar caixa registradora:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// PUT /api/cash-registers/[id] - Atualizar caixa registradora
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()
    const { status, finalAmount, currentAmount } = body

    // Verificar se a caixa registradora existe
    const existingCashRegister = await prisma.cashRegister.findUnique({
      where: { id },
    })

    if (!existingCashRegister) {
      return NextResponse.json(
        { error: 'Caixa registradora não encontrada' },
        { status: 404 }
      )
    }

    // Preparar dados para atualização
    const updateData: any = {}
    
    if (status) {
      if (!['OPEN', 'CLOSED'].includes(status.toUpperCase())) {
        return NextResponse.json(
          { error: 'Status deve ser OPEN ou CLOSED' },
          { status: 400 }
        )
      }
      updateData.status = status.toUpperCase()
    }

    if (currentAmount !== undefined) {
      if (isNaN(parseFloat(currentAmount)) || parseFloat(currentAmount) < 0) {
        return NextResponse.json(
          { error: 'Valor atual deve ser um número não negativo' },
          { status: 400 }
        )
      }
      updateData.currentAmount = parseFloat(currentAmount)
    }

    if (finalAmount !== undefined) {
      if (isNaN(parseFloat(finalAmount)) || parseFloat(finalAmount) < 0) {
        return NextResponse.json(
          { error: 'Valor final deve ser um número não negativo' },
          { status: 400 }
        )
      }
      updateData.finalAmount = parseFloat(finalAmount)
    }

    // Se está fechando a caixa, definir valor final se não fornecido
    if (status === 'CLOSED' && finalAmount === undefined) {
      updateData.finalAmount = existingCashRegister.currentAmount
    }

    // Atualizar caixa registradora
    const cashRegister = await prisma.cashRegister.update({
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
      },
    })

    return NextResponse.json(cashRegister)
  } catch (error) {
    console.error('Erro ao atualizar caixa registradora:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// DELETE /api/cash-registers/[id] - Deletar caixa registradora
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // Verificar se a caixa registradora existe
    const existingCashRegister = await prisma.cashRegister.findUnique({
      where: { id },
      include: {
        sales: true,
      },
    })

    if (!existingCashRegister) {
      return NextResponse.json(
        { error: 'Caixa registradora não encontrada' },
        { status: 404 }
      )
    }

    // Verificar se há vendas associadas
    if (existingCashRegister.sales.length > 0) {
      return NextResponse.json(
        { error: 'Não é possível deletar caixa registradora com vendas associadas' },
        { status: 409 }
      )
    }

    // Deletar caixa registradora
    await prisma.cashRegister.delete({
      where: { id },
    })

    return NextResponse.json(
      { message: 'Caixa registradora deletada com sucesso' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Erro ao deletar caixa registradora:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}