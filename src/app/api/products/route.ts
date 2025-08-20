import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/products - Listar todos os produtos
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const active = searchParams.get('active')

    const whereClause: { active?: boolean } = {}
    if (active !== null) {
      whereClause.active = active === 'true'
    }

    const products = await prisma.product.findMany({
      where: whereClause,
      orderBy: {
        name: 'asc',
      },
    })

    return NextResponse.json(products)
  } catch (error) {
    console.error('Erro ao buscar produtos:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST /api/products - Criar novo produto
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, price, imageUri } = body

    // Validações básicas
    if (!name || !price) {
      return NextResponse.json(
        { error: 'Nome e preço são obrigatórios' },
        { status: 400 }
      )
    }

    if (isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
      return NextResponse.json(
        { error: 'Preço deve ser um número positivo' },
        { status: 400 }
      )
    }

    // Verificar se já existe um produto com o mesmo nome
    const existingProduct = await prisma.product.findFirst({
      where: { name },
    })

    if (existingProduct) {
      return NextResponse.json(
        { error: 'Já existe um produto com este nome' },
        { status: 409 }
      )
    }

    // Criar produto
    const product = await prisma.product.create({
      data: {
        name,
        description,
        price: parseFloat(price),
        imageUri,
      },
    })

    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar produto:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}