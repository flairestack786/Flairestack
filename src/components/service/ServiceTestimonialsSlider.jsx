import React from 'react'
import { Quote } from 'lucide-react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay, Pagination } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/pagination'

export default function ServiceTestimonialsSlider({ testimonials }) {
  if (!testimonials?.length) return null

  return (
    <div className="sp-testimonials-slider">
      <Swiper
        className="sp-testimonials-swiper"
        modules={[Autoplay, Pagination]}
        loop={testimonials.length > 1}
        speed={650}
        slidesPerView={1}
        spaceBetween={20}
        autoplay={{
          delay: 5000,
          disableOnInteraction: false,
          pauseOnMouseEnter: true,
        }}
        pagination={{ clickable: true }}
        breakpoints={{
          640: { slidesPerView: 2, spaceBetween: 20 },
          1024: { slidesPerView: 3, spaceBetween: 20 },
        }}
      >
        {testimonials.map((t) => (
          <SwiperSlide key={t.id ?? t.author}>
            <blockquote className="sp-testimonial sp-card-premium sp-card-premium--light">
              <Quote size={24} className="sp-testimonial-quote-icon" aria-hidden />
              <p>&ldquo;{t.quote}&rdquo;</p>
              <div className="sp-testimonial-bottom">
                <footer>
                  <cite>{t.author}</cite>
                  <span>{t.role}</span>
                </footer>
                {(t.stat || t.statLabel) && (
                  <div className="sp-testimonial-stat">
                    <strong>{t.stat}</strong>
                    <span>{t.statLabel}</span>
                  </div>
                )}
              </div>
            </blockquote>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  )
}
