import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/products/[id] - Buscar produto por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const product = await prisma.product.findUnique({
      where: { id },
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Produto não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(product)
  } catch (error) {
    console.error('Erro ao buscar produto:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// PUT /api/products/[id] - Atualizar produto
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, description, price, imageUri, active } = body

    // Verificar se o produto existe
    const existingProduct = await prisma.product.findUnique({
      where: { id },
    })

    if (!existingProduct) {
      return NextResponse.json(
        { error: 'Produto não encontrado' },
        { status: 404 }
      )
    }

    // Verificar se o nome já está em uso por outro produto
    if (name && name !== existingProduct.name) {
      const nameInUse = await prisma.product.findFirst({
        where: {
          name,
          id: { not: id },
        },
      })

      if (nameInUse) {
        return NextResponse.json(
          { error: 'Já existe um produto com este nome' },
          { status: 409 }
        )
      }
    }

    // Validar preço se fornecido
    if (price !== undefined) {
      if (isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
        return NextResponse.json(
          { error: 'Preço deve ser um número positivo' },
          { status: 400 }
        )
      }
    }

    // Preparar dados para atualização
    const updateData: { name?: string; description?: string | null; price?: number; imageUri?: string | null; active?: boolean } = {}
    if (name) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (price !== undefined) updateData.price = parseFloat(price)
    if (imageUri !== undefined) updateData.imageUri = imageUri
    if (typeof active === 'boolean') updateData.active = active

    // Atualizar produto
    const product = await prisma.product.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json(product)
  } catch (error) {
    console.error('Erro ao atualizar produto:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// DELETE /api/products/[id] - Deletar produto
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Verificar se o produto existe
    const existingProduct = await prisma.product.findUnique({
      where: { id },
    })

    if (!existingProduct) {
      return NextResponse.json(
        { error: 'Produto não encontrado' },
        { status: 404 }
      )
    }

    // Deletar produto
    await prisma.product.delete({
      where: { id },
    })

    return NextResponse.json(
      { message: 'Produto deletado com sucesso' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Erro ao deletar produto:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}