import http from "node:http"
import fs from "node:fs"
import url from "node:url"

const PORT = 3000
const dataJson = 'data.json'

function readEmpregados() {
  if (fs.existsSync(dataJson)) {
    const data = fs.readFileSync(dataJson)
    return JSON.parse(data)
  }
  return []
}

function writeEmpregados(empregados) {
  fs.writeFileSync(dataJson, JSON.stringify(empregados, null, 2))
}

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true)
  const method = req.method

  if (parsedUrl.pathname === '/empregados' && method === 'POST') {
    let body = ''
    req.on('data', chunk => {
      body += chunk.toString()
    })
    req.on('end', () => {
      const newEmpregado = JSON.parse(body)

      const birthDate = new Date(newEmpregado.data_nascimento)
      const age = new Date().getFullYear() - birthDate.getFullYear()
      if (age < 18) {
        res.writeHead(400, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'O funcionário deve ter 18 anos ou mais.' }))
        return
      }

      const empregados = readEmpregados()
      newEmpregado.id = empregados.length ? empregados[empregados.length - 1].id + 1 : 1
      empregados.push(newEmpregado)
      writeEmpregados(empregados)

      res.writeHead(201, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify(newEmpregado))
    })

  } else if (parsedUrl.pathname === '/empregados' && method === 'GET') {
    const empregados = readEmpregados()
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify(empregados))

  } else if (parsedUrl.pathname.match(/\/empregados\/\d+/) && method === 'GET') {
    const id = parseInt(parsedUrl.pathname.split('/')[2])
    const empregados = readEmpregados()
    const empregado = empregados.find(e => e.id === id)

    if (empregado) {
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify(empregado))
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Funcionário não encontrado.' }))
    }

  } else if (parsedUrl.pathname.match(/\/empregados\/\d+/) && method === 'PUT') {
    const id = parseInt(parsedUrl.pathname.split('/')[2])
    let body = ''
    req.on('data', chunk => {
      body += chunk.toString()
    })
    req.on('end', () => {
      const updatedData = JSON.parse(body)
      const empregados = readEmpregados()
      const index = empregados.findIndex(e => e.id === id)

      if (index !== -1) {
        empregados[index] = { ...empregados[index], ...updatedData }
        writeEmpregados(empregados)
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify(empregados[index]))
      } else {
        res.writeHead(404, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'Funcionário não encontrado.' }))
      }
    })

  } else if (parsedUrl.pathname.match(/\/empregados\/\d+/) && method === 'DELETE') {
    const id = parseInt(parsedUrl.pathname.split('/')[2])
    let empregados = readEmpregados()
    empregados = empregados.filter(e => e.id !== id)
    writeEmpregados(empregados)

    res.writeHead(204, { 'Content-Type': 'application/json' })
    res.end()

  } else if (parsedUrl.pathname === '/empregados/count' && method === 'GET') {
    const empregados = readEmpregados()
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ count: empregados.length }))

  } else if (parsedUrl.pathname.match(/\/empregados\/porCargo\/.+/) && method === 'GET') {
    const cargo = parsedUrl.pathname.split('/')[3]
    const empregados = readEmpregados()
    const filtered = empregados.filter(e => e.cargo === cargo)

    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify(filtered))

  } else if (parsedUrl.pathname.match(/\/empregados\/porHabilidade\/.+/) && method === 'GET') {
    const habilidade = parsedUrl.pathname.split('/')[3]
    const empregados = readEmpregados()
    const filtered = empregados.filter(e => e.habilidades.includes(habilidade))

    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify(filtered))

  } else if (parsedUrl.pathname === '/empregados/porFaixaSalarial' && method === 'GET') {
    const min = parseFloat(parsedUrl.query.min)
    const max = parseFloat(parsedUrl.query.max)
    const empregados = readEmpregados()
    const filtered = empregados.filter(e => e.salario >= min && e.salario <= max)

    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify(filtered))

  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'não encontrada.' }))
  }
})

server.listen(PORT, () => {
  console.log(`Servidor rodando ${PORT}`)
})
