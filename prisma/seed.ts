import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Criar usuário administrador padrão
  const hashedPassword = await bcrypt.hash('Fr3di@d3v', 10)
  
  const admin = await prisma.user.upsert({
    where: { login: 'administrador' },
    update: {
      password: hashedPassword,
    },
    create: {
      login: 'administrador',
      password: hashedPassword,
    },
  })

  console.log('Usuário administrador criado:', admin)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
