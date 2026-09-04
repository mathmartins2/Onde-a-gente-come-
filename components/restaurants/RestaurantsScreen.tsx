'use client'

import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { RestaurantForm } from './RestaurantForm'
import { RestaurantList } from './RestaurantList'

export const RestaurantsScreen = () => {
  const [isFormOpen, setIsFormOpen] = useState(false)

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Lugares</h1>
        <Button variant="secondary" size="small" onClick={() => setIsFormOpen((open) => !open)}>
          {isFormOpen ? <X size={14} /> : <Plus size={14} />}
          {isFormOpen ? 'fechar' : 'novo'}
        </Button>
      </div>

      {isFormOpen ? <RestaurantForm onCreated={() => setIsFormOpen(false)} /> : null}

      <RestaurantList />
    </div>
  )
}
