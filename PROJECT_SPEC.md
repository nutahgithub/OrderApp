# 🚀 Smart Restaurant OS — Project Specification

## 🧾 Project Info
- Name: Smart Restaurant OS
- Type: SaaS (Multi-tenant)
- Domain: Restaurant / Cafe Management
- Architecture: Modular Monolith
- Main Tech: Node.js + Prisma + MySQL + Redis + Socket.IO

## 1. Objectives
- QR order system
- Multi-tenant support
- Real-time processing
- Revenue dashboard
- AWS deployment

## 2. Tech Stack
Backend: Node.js (TypeScript), Express/Fastify, Prisma, Socket.IO
Frontend: ReactJS
DB: MySQL
Cache: Redis
Infra: AWS ECS, RDS, S3, CloudWatch

## 3. Architecture
Client -> Node API -> Prisma -> MySQL -> Redis

## 4. Multi-Tenant
- Shared DB
- tenant_id required in all tables

## 5. Modules
auth, tenant, branch, table, menu, order, payment, report

## 6. Database (simplified)
tenants(id, name)
branches(id, tenant_id, name)
tables(id, tenant_id, branch_id, name, status)
menus(id, tenant_id, name, price)
orders(id, tenant_id, branch_id, table_id, status, total)
order_items(id, order_id, menu_id, quantity)

## 7. Order Flow
Customer -> Order -> API -> Transaction -> Save -> Response

## 8. Realtime
Socket.IO rooms per tenant/branch/table

## 9. Auth
Customer: no login
Admin: JWT

## 10. Rules
- No any
- Always tenant_id
- No business logic in controller

## 11. Roadmap
Phase 1: Setup
Phase 2: Order
Phase 3: Realtime
Phase 4: Dashboard
Phase 5: Deploy

## START
- Setup Node + Prisma
- Implement order module
