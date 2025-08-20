import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/cash-registers - Listar todas as caixas registradoras
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const userId = searchParams.get('userId')

    const whereClause: any = {}
    if (status) {
      whereClause.status = status.toUpperCase()
    }
    if (userId) {
      whereClause.userId = userId
    }

    const cashRegisters = await prisma.cashRegister.findMany({
      where: whereClause,
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
            createdAt: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(cashRegisters)
  } catch (error) {
    console.error('Erro ao buscar caixas registradoras:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST /api/cash-registers - Criar nova caixa registradora
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, initialAmount = 0 } = body

    // Validações básicas
    if (!userId) {
      return NextResponse.json(
        { error: 'ID do usuário é obrigatório' },
        { status: 400 }
      )
    }

    if (isNaN(parseFloat(initialAmount)) || parseFloat(initialAmount) < 0) {
      return NextResponse.json(
        { error: 'Valor inicial deve ser um número não negativo' },
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

    // Verificar se o usuário já tem uma caixa aberta
    const openCashRegister = await prisma.cashRegister.findFirst({
      where: {
        userId,
        status: 'OPEN',
      },
    })

    if (openCashRegister) {
      return NextResponse.json(
        { error: 'Usuário já possui uma caixa aberta' },
        { status: 409 }
      )
    }

    // Criar caixa registradora
    const cashRegister = await prisma.cashRegister.create({
      data: {
        userId,
        initialAmount: parseFloat(initialAmount),
        currentAmount: parseFloat(initialAmount),
      },
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

    return NextResponse.json(cashRegister, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar caixa registradora:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}