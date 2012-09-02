atom.input.bind atom.key.LEFT_ARROW, 'left'
atom.input.bind atom.key.RIGHT_ARROW, 'right'
atom.input.bind atom.key.SPACE, 'jump'

game = new Game

window.onblur = ->
  game.stop()

window.onfocus = ->
  game.run()

game.run()
