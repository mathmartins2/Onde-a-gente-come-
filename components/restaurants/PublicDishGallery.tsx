'use client'

import Image from 'next/image'
import { useState } from 'react'
import { PhotoLightbox } from '@/components/ui/PhotoLightbox'
import { storedImageLoader } from '@/lib/images/storedImageLoader'

export const PublicDishGallery = ({ restaurantName, photoUrls }: { restaurantName: string; photoUrls: string[] }) => {
  const [openPhotoIndex, setOpenPhotoIndex] = useState<number | null>(null)

  return (
    <>
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {photoUrls.map((photoUrl, photoIndex) => (
          <li key={photoUrl} className="overflow-hidden rounded-xl border border-hairline bg-surface-sunken">
            <button
              type="button"
              aria-label={`Ver prato ${photoIndex + 1} em tela cheia`}
              onClick={() => setOpenPhotoIndex(photoIndex)}
              className="relative block aspect-square w-full"
            >
              <Image
                loader={storedImageLoader}
                src={photoUrl}
                alt={`Prato ${photoIndex + 1} em ${restaurantName}`}
                fill
                sizes="(min-width: 640px) 150px, 45vw"
                className="object-cover transition-transform duration-300 hover:scale-105"
              />
            </button>
          </li>
        ))}
      </ul>
      <PhotoLightbox
        photos={photoUrls.map((photoUrl) => ({ url: photoUrl, caption: restaurantName }))}
        openIndex={openPhotoIndex}
        onChangeIndex={setOpenPhotoIndex}
        onClose={() => setOpenPhotoIndex(null)}
      />
    </>
  )
}
