import React from 'react'
import { Star } from 'lucide-react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay, EffectFade, Pagination } from 'swiper/modules'
import { homeTestimonials } from '../data/homeTestimonials'
import 'swiper/css'
import 'swiper/css/effect-fade'
import 'swiper/css/pagination'

function TrustBadge({ platform, reviews, accentClass, letter }) {
  return (
    <div className={`testimonials-badge testimonials-badge--${platform}`}>
      <span className={`testimonials-badge-mark ${accentClass}`} aria-hidden>
        {letter}
      </span>
      <div className="testimonials-badge-stars" aria-hidden>
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} size={14} fill="currentColor" strokeWidth={0} />
        ))}
      </div>
      <span className="testimonials-badge-count">{reviews} REVIEWS</span>
    </div>
  )
}

export default function Testimonials() {
  return (
    <section id="testimonials" className="testimonials-section" aria-labelledby="testimonials-heading">
      <div className="testimonials-glow" aria-hidden />

      <div className="testimonials-inner">
        <header className="testimonials-header">
          <h2 id="testimonials-heading" className="testimonials-title">
            Our clients simply love <span className="testimonials-accent">what we do</span>
          </h2>
          <p className="testimonials-intro">
            Proud to serve as the innovation partner for industry leaders who have experienced our
            expertise and excellence firsthand.
          </p>

          <div className="testimonials-trust">
            <TrustBadge platform="clutch" letter="C" reviews={52} accentClass="testimonials-badge-mark--clutch" />
            <TrustBadge
              platform="goodfirms"
              letter="G"
              reviews={32}
              accentClass="testimonials-badge-mark--goodfirms"
            />
          </div>
        </header>

        <div className="testimonials-slider-wrap">
          <Swiper
            className="testimonials-swiper"
            modules={[Autoplay, EffectFade, Pagination]}
            effect="fade"
            fadeEffect={{ crossFade: true }}
            loop
            speed={700}
            slidesPerView={1}
            autoplay={{
              delay: 5500,
              disableOnInteraction: false,
              pauseOnMouseEnter: true,
            }}
            pagination={{ clickable: true, dynamicBullets: false }}
            a11y={{ prevSlideMessage: 'Previous testimonial', nextSlideMessage: 'Next testimonial' }}
          >
            {homeTestimonials.map((item) => (
              <SwiperSlide key={item.author}>
                <article className="testimonial-card">
                  <p className="testimonial-quote">&ldquo;{item.quote}&rdquo;</p>
                  <footer className="testimonial-footer">
                    <div className="testimonial-avatar" aria-hidden>
                      {item.initials}
                    </div>
                    <div className="testimonial-meta">
                      <cite className="testimonial-author">{item.author}</cite>
                      <span className="testimonial-role">{item.role}</span>
                    </div>
                  </footer>
                </article>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>
    </section>
  )
}
