'use client'

import { useState } from 'react'

export default function TradingPanel() {
  const [formData, setFormData] = useState({
    symbol: 'WINFUT',
    side: 'BUY',
    quantity: 1,
    price: '',
    stop_loss: '',
    take_profit: '',
    comment: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setMessage(null)

    try {
      // Aqui você implementaria a autenticação JWT
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/trade`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // 'Authorization': `Bearer ${token}` // Implementar autenticação
        },
        body: JSON.stringify({
          ...formData,
          quantity: parseFloat(formData.quantity.toString()),
          price: formData.price ? parseFloat(formData.price) : null,
          stop_loss: formData.stop_loss ? parseFloat(formData.stop_loss) : null,
          take_profit: formData.take_profit ? parseFloat(formData.take_profit) : null,
        })
      })

      if (!response.ok) {
        throw new Error('Erro ao executar trade')
      }

      const result = await response.json()
      setMessage({ type: 'success', text: `Trade executado com sucesso! ID: ${result.trade_id}` })
      
      // Reset form
      setFormData({
        ...formData,
        price: '',
        stop_loss: '',
        take_profit: '',
        comment: ''
      })
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Erro desconhecido' 
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-800">Painel de Trading</h2>
      
      {message && (
        <div className={`p-4 rounded ${
          message.type === 'success' 
            ? 'bg-green-100 border border-green-400 text-green-700'
            : 'bg-red-100 border border-red-400 text-red-700'
        }`}>
          {message.text}
        </div>
      )}

      <div className="bg-white p-6 rounded-lg shadow border">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Símbolo
              </label>
              <select
                name="symbol"
                value={formData.symbol}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="WINFUT">WINFUT - Índice Futuro</option>
                <option value="WDOFUT">WDOFUT - Dólar Futuro</option>
                <option value="PETR4">PETR4 - Petrobras</option>
                <option value="VALE3">VALE3 - Vale</option>
                <option value="ITUB4">ITUB4 - Itaú</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Operação
              </label>
              <select
                name="side"
                value={formData.side}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="BUY">Compra</option>
                <option value="SELL">Venda</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quantidade
              </label>
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleInputChange}
                min="1"
                step="1"
                required
                className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Preço (opcional)
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                step="0.01"
                placeholder="Mercado"
                className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Stop Loss (opcional)
              </label>
              <input
                type="number"
                name="stop_loss"
                value={formData.stop_loss}
                onChange={handleInputChange}
                step="0.01"
                className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Take Profit (opcional)
              </label>
              <input
                type="number"
                name="take_profit"
                value={formData.take_profit}
                onChange={handleInputChange}
                step="0.01"
                className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Comentário (opcional)
            </label>
            <textarea
              name="comment"
              value={formData.comment}
              onChange={handleInputChange}
              rows={3}
              className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
              placeholder="Adicione um comentário sobre esta operação..."
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-2 px-4 rounded font-medium ${
              isSubmitting
                ? 'bg-gray-400 cursor-not-allowed'
                : formData.side === 'BUY'
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-red-600 hover:bg-red-700'
            } text-white transition-colors`}
          >
            {isSubmitting ? 'Executando...' : `${formData.side === 'BUY' ? 'Comprar' : 'Vender'} ${formData.symbol}`}
          </button>
        </form>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 p-4 rounded">
        <div className="flex">
          <span className="text-yellow-400 mr-2">⚠️</span>
          <div>
            <h3 className="font-medium text-yellow-800">Aviso Importante</h3>
            <p className="text-yellow-700 text-sm mt-1">
              Esta é uma versão de demonstração. Para executar trades reais, você precisa configurar 
              suas credenciais de corretora e implementar a autenticação JWT.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

