const ANIMATION_DELAY = 100

const states = {
  idle: 'idle',
  dragging: 'dragging',
}
let currentState = states.idle

const sliderOptions = [
  {
    label: 'small',
    value: 0,
    semanticValue: "1",
  },
  {
    label: 'normal',
    value: 0.2,
    semanticValue: "2",
  },
  {
    label: '.',
    value: 0.4,
    semanticValue: "3",
  },
  {
    label: '.',
    value: 0.6,
    semanticValue: "4",
  },
  {
    label: '.',
    value: 0.8,
    semanticValue: "5",
  },
  {
    label: 'big',
    value: 1,
    semanticValue: "6",
  },
]

function onsubmit(e) {
  e.preventDefault()
  console.log(e)
  console.log("Form:", Array.from(new FormData(e.target).entries().map(entry => entry.join(': '))))
}

function translate(x, y) {
  return `translate(${x}px, ${y}px)`
}

function setValue(magnetSlider, value, semanticValue) {
  setFieldValue(magnetSlider, value, semanticValue)
  setViewValue(magnetSlider, value)
}

function setSemanticValue(magnetSlider, semanticValue) {
  magnetSlider.semanticField.value = semanticValue ?? magnetSlider.semanticField.value
}

function setFieldOnlyValue(magnetSlider, value) {
  magnetSlider.field.value = value
}

function setFieldValue(magnetSlider, value, semanticValue) {
  setFieldOnlyValue(magnetSlider, value)
  setSemanticValue(magnetSlider, semanticValue)
}

// reverse affected
function setViewValue(magnetSlider, value) {
  const {thumb, track, progress, slider} = magnetSlider

  const sliderWidth = slider.offsetWidth
  const progressWidth = progress.offsetWidth
  const halfThumb = thumb.offsetWidth / 2
  
  // move thumb
  thumb.style.transform = translate(value * sliderWidth - halfThumb, 0)

  // move track
  track.style.transform = translate(value * sliderWidth, 0)

  // move progress
  progress.style.transform = translate(value * sliderWidth - progressWidth, 0)
}

function initMagnetSlider(magnetSlider) {
  console.log('initMagnetSlider')

  console.log(magnetSlider.field.value)
  console.log(magnetSlider.semanticField.value)

  const initOption = magnetSlider.semanticField.value
    ? sliderOptions.find(option => option.semanticValue === magnetSlider.semanticField.value)
    : null
  
  const initValue = initOption
    ? initOption.value
    : parseFloat(magnetSlider.field.value)

  setValue(magnetSlider, initValue, initOption.semanticValue)

  // put options
  const {options} = magnetSlider
  const optionsWidth = options.offsetWidth

  optionElements = sliderOptions.map(option => {
    const element = document.createElement('span')
    if (option.semanticValue === initOption.semanticValue) {
      element.classList.add('active')
    }
    element.innerText = option.label
    return element
  })
  
  options.replaceChildren(...optionElements)

  optionElements.reduce((acc_offset, element, index) => {
    const option = sliderOptions[index]
    const elementWidth = element.offsetWidth
    const minLengthFactor = Math.min(option.value, 1 - option.value) * optionsWidth

    // Прибиваем к краю
    if (minLengthFactor < elementWidth / 2) {
      const offset = option.value <= 0.5 ? -acc_offset : optionsWidth - acc_offset - elementWidth
      element.style.transform = translate(offset, 0)
      return acc_offset + elementWidth
    }

    const offset = option.value * optionsWidth - acc_offset - elementWidth / 2
    element.style.transform = translate(offset, 0)
    return acc_offset + elementWidth
  }, 0)
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelector('form').addEventListener('submit', onsubmit)
  
  const body = document.body
  
  const input = document.querySelector('.input')
  const field = document.querySelector('.input_field')
  const semanticField = document.querySelector('.input_semantic-field')
  const slider = document.querySelector('.input_slider')
  const thumb = document.querySelector('.input_thumb')
  const track = document.querySelector('.input_track')
  const progress = document.querySelector('.input_progress')
  const options = document.querySelector('.input_options')

  const inputComputedStyles = window.getComputedStyle(input)
  
  const magnetSlider = {
    input,
    field,
    semanticField,
    slider,
    thumb,
    track,
    progress,
    options,
    meta: {
      input: {
        paddingLeft: parseInt(inputComputedStyles.getPropertyValue('padding-left')),
        paddingRight: parseInt(inputComputedStyles.getPropertyValue('padding-right')),
      }
    }
  }

  console.log('magnetSlider', magnetSlider)

  initMagnetSlider(magnetSlider)

  function calcValue(event) {
    const offsetX = event.changedTouches[0].pageX - magnetSlider.input.getBoundingClientRect().left

    const {paddingLeft, paddingRight} = magnetSlider.meta.input
    
    const inputRealWidth = magnetSlider.input.offsetWidth - paddingLeft - paddingRight

    let value = 0

    if (offsetX < paddingLeft) {
      value = 0
    } else if (offsetX >= paddingLeft + inputRealWidth) {
      value = 1
    } else {
      value = (offsetX - paddingLeft) / inputRealWidth
    }

    return value
  }
  
  function handleInput(event) {
    const value = calcValue(event)
    setValue(magnetSlider, value)
  }

  function addTransition() {
    magnetSlider.thumb.style.transition = `transform ${(ANIMATION_DELAY / 1000).toFixed(2)}s ease-in-out`
    magnetSlider.track.style.transition = `transform ${(ANIMATION_DELAY / 1000).toFixed(2)}s ease-in-out`
    magnetSlider.progress.style.transition = `transform ${(ANIMATION_DELAY / 1000).toFixed(2)}s ease-in-out`
  }

  function removeTransition() {
    magnetSlider.thumb.style.transition = ''
    magnetSlider.track.style.transition = ''
    magnetSlider.progress.style.transition = ''
  }

  function handleChange(event) {
    const value = calcValue(event)

    let i = 0
    for(; i < sliderOptions.length && sliderOptions[i].value < value; i++) {}

    i = i < sliderOptions.length ? i : sliderOptions.length - 1;

    const optionWithDistance = [
      {option: sliderOptions[i], dst: Math.abs(value - sliderOptions[i].value), i},
      i > 0 ? {option: sliderOptions[i - 1], dst: Math.abs(value - sliderOptions[i - 1].value), i: i - 1} : null,
    ].filter(Boolean).sort((a, b) => a.dst - b.dst)[0]

    console.log(optionWithDistance)
    
    const arrayOfOption = Array.from(magnetSlider.options.children)
    arrayOfOption.forEach(option => option.classList.remove('active'))
    arrayOfOption[optionWithDistance.i].classList.add('active')
    
    setValue(magnetSlider, optionWithDistance.option.value, optionWithDistance.option.semanticValue)
  }

  function handleTouchStart(e) {
    if (currentState !== states.idle) {
      return
    }

    // e.preventDefault()

    console.log('touchstart', e)

    currentState = states.dragging
    document.addEventListener('touchmove', handleTouchMove)
    document.addEventListener('touchend', handleTouchEnd)
    body.classList.add('user-blocked')

    removeTransition()

    handleInput(e)
  }

  function handleTouchMove(e) {
    if (currentState !== states.dragging) {
      return
    }

    // e.preventDefault()

    handleInput(e)
  }

  function handleTouchEnd(e) {
    if (currentState !== states.dragging) {
      return
    }

    // e.preventDefault()

    console.log('touchend', e)

    currentState = states.idle
    document.removeEventListener('touchmove', handleTouchMove)
    document.removeEventListener('touchend', handleTouchEnd)
    body.classList.remove('user-blocked')

    addTransition()
    
    handleChange(e)
  }

  input.addEventListener('touchstart', handleTouchStart)
})