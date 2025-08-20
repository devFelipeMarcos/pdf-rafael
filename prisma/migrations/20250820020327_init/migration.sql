-- CreateEnum
CREATE TYPE "public"."Role" AS ENUM ('admin', 'user');

-- CreateEnum
CREATE TYPE "public"."CashRegisterStatus" AS ENUM ('open', 'closed');

-- CreateEnum
CREATE TYPE "public"."PaymentMethod" AS ENUM ('cash', 'card', 'pix');

-- CreateEnum
CREATE TYPE "public"."SaleStatus" AS ENUM ('pending', 'completed', 'cancelled');

-- CreateTable
CREATE TABLE "public"."users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "public"."Role" NOT NULL DEFAULT 'user',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."products" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "image_uri" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."cash_registers" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "status" "public"."CashRegisterStatus" NOT NULL DEFAULT 'open',
    "initial_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "current_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "final_amount" DECIMAL(10,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cash_registers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."sales" (
    "id" TEXT NOT NULL,
    "cash_register_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "items" JSONB NOT NULL,
    "total" DECIMAL(10,2) NOT NULL,
    "payment_method" "public"."PaymentMethod" NOT NULL,
    "status" "public"."SaleStatus" NOT NULL DEFAULT 'completed',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sales_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "public"."users"("email");

-- CreateIndex
CREATE INDEX "cash_registers_user_id_idx" ON "public"."cash_registers"("user_id");

-- CreateIndex
CREATE INDEX "cash_registers_status_idx" ON "public"."cash_registers"("status");

-- CreateIndex
CREATE INDEX "sales_cash_register_id_idx" ON "public"."sales"("cash_register_id");

-- CreateIndex
CREATE INDEX "sales_user_id_idx" ON "public"."sales"("user_id");

-- CreateIndex
CREATE INDEX "sales_created_at_idx" ON "public"."sales"("created_at");

-- AddForeignKey
ALTER TABLE "public"."cash_registers" ADD CONSTRAINT "cash_registers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sales" ADD CONSTRAINT "sales_cash_register_id_fkey" FOREIGN KEY ("cash_register_id") REFERENCES "public"."cash_registers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sales" ADD CONSTRAINT "sales_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
