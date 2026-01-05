-- CreateTable
CREATE TABLE "public"."Staff" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "branch" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "mobile" TEXT NOT NULL,
    "pin" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "counterNo" INTEGER,

    CONSTRAINT "Staff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProductMeta" (
    "id" TEXT NOT NULL,
    "searchQuery" TEXT,
    "metric" TEXT NOT NULL DEFAULT 'None',
    "name" TEXT NOT NULL,
    "categories" TEXT[],
    "brand" TEXT,
    "description" TEXT,
    "shortDescription" TEXT,
    "images" TEXT[],
    "tags" TEXT[],

    CONSTRAINT "ProductMeta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProductVarient" (
    "id" TEXT NOT NULL,
    "metaId" TEXT NOT NULL,
    "barcode" TEXT,
    "variation" JSONB,
    "prices" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductVarient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Expense" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "amount" TEXT NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "remarks" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "orderMetaId" TEXT,

    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Income" (
    "id" TEXT NOT NULL,
    "orderId" TEXT,
    "category" TEXT NOT NULL,
    "amount" TEXT NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Income_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CustomerMeta" (
    "id" TEXT NOT NULL,
    "mobile" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomerMeta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CustomerResidential" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "billingAddress" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "postalCode" TEXT NOT NULL,

    CONSTRAINT "CustomerResidential_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."OrderMeta" (
    "id" TEXT NOT NULL,
    "invoiceId" SERIAL NOT NULL,
    "customerId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "branch" TEXT NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "saleValue" DECIMAL(10,2) NOT NULL,
    "deliveryfee" DECIMAL(10,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "shippingAddress" TEXT,
    "additionalMobile" TEXT,
    "customerIp" TEXT,
    "operator" TEXT NOT NULL DEFAULT 'ecom',

    CONSTRAINT "OrderMeta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."OrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "unitPrice" DECIMAL(10,2) NOT NULL,
    "quantity" DECIMAL(10,2) NOT NULL,
    "productVarientId" TEXT NOT NULL,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."BranchMeta" (
    "id" TEXT NOT NULL,
    "hotlines" TEXT[],
    "address" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "branch" TEXT NOT NULL,

    CONSTRAINT "BranchMeta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."BusinessMeta" (
    "id" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "businessLogo" TEXT NOT NULL,
    "plan" TEXT NOT NULL DEFAULT 'Free',
    "planCycle" TEXT NOT NULL DEFAULT 'Monthly',
    "ownerName" TEXT NOT NULL,
    "ownerMobileNos" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "categories" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "expenseCategories" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "sms" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "BusinessMeta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Plan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "monthlyPrice" DECIMAL(10,2) NOT NULL,
    "yearlyDiscountPercentage" DECIMAL(20,16) NOT NULL,

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Payments" (
    "id" TEXT NOT NULL,
    "note" TEXT,
    "businessMetaId" TEXT NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "paymentProof" TEXT,
    "amount" DECIMAL(10,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiredAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Staff_email_key" ON "public"."Staff"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Staff_mobile_key" ON "public"."Staff"("mobile");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerMeta_mobile_key" ON "public"."CustomerMeta"("mobile");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerResidential_customerId_key" ON "public"."CustomerResidential"("customerId");

-- CreateIndex
CREATE UNIQUE INDEX "OrderMeta_invoiceId_key" ON "public"."OrderMeta"("invoiceId");

-- AddForeignKey
ALTER TABLE "public"."ProductVarient" ADD CONSTRAINT "ProductVarient_metaId_fkey" FOREIGN KEY ("metaId") REFERENCES "public"."ProductMeta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Expense" ADD CONSTRAINT "Expense_orderMetaId_fkey" FOREIGN KEY ("orderMetaId") REFERENCES "public"."OrderMeta"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Income" ADD CONSTRAINT "Income_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."OrderMeta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CustomerResidential" ADD CONSTRAINT "CustomerResidential_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."CustomerMeta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OrderMeta" ADD CONSTRAINT "OrderMeta_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."CustomerMeta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OrderMeta" ADD CONSTRAINT "OrderMeta_operator_fkey" FOREIGN KEY ("operator") REFERENCES "public"."Staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."OrderMeta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OrderItem" ADD CONSTRAINT "OrderItem_productVarientId_fkey" FOREIGN KEY ("productVarientId") REFERENCES "public"."ProductVarient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Payments" ADD CONSTRAINT "Payments_businessMetaId_fkey" FOREIGN KEY ("businessMetaId") REFERENCES "public"."BusinessMeta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
