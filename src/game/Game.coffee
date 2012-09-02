class Game extends atom.Game
  constructor: ->
    super

    @sprites = []

    @ctx = atom.context

    @world = new World()

    @player = new Player(v atom.width/2, 0)

    @debug = false

    @camera = v (@player.pos.x - atom.width/2), 0
    @lookahead = 0

    @cameraPeriod = 0.001
    @cameraTime = 0
    @cameraSpeed = 0.1

    @backgroundSpeed = 0.1

    @verticalMargin = 64
    @height = 500
    @width = 1024

  isCollided: (aObject, bObject) ->
    a = @getCollision aObject
    b = @getCollision bObject
    
    isCollided = false
    if (a.shape is 'rect') and (b.shape is 'rect')
      return (a.x <= b.x + b.width) and (a.x + a.width >= b.x) and (a.y <= b.y + b.height) and (a.y + a.height >= b.y)

    return false

  getCollision: (object) -> 
    if (typeof object.collision is 'function') 
      object.collision()
    else
      object.collision

  update: (dt) ->
    playerCollisions = (@getCollision(object) for object in @world.collisionObjects when @isCollided(@player, object))
    @player.update dt, playerCollisions

    if @cameraTime <= 0
      @cameraTime = @cameraPeriod

      @camera.x = lerp @cameraSpeed, @camera.x, (@player.pos.x + @player.width/2 + @lookahead - atom.width/2)
      @lookahead = lerp 0.01, @lookahead, @player.velocity.x*atom.width/16


    @cameraTime -= dt

  draw: ->
    @ctx.fillStyle = 'black'
    @ctx.fillRect 0, 0, atom.width, atom.height

    @ctx.save()
    @ctx.translate (atom.width-@width)/2, @verticalMargin

    numLayers = @world.backgroundLayers.length
    for i in [0...numLayers]
      layer = @world.backgroundLayers[i]

      @ctx.save()
      @ctx.translate -@camera.x/(8*(numLayers-i+1)), 0


      @ctx.drawImage layer, layer.width-1, 0, layer.width, layer.height
      @ctx.drawImage layer, 0, 0, layer.width, layer.height
      @ctx.drawImage layer, -layer.width+1, 0, layer.width, layer.height

      @ctx.restore()



    @ctx.save()
    @ctx.translate -@camera.x, -@camera.y

    for object in @world.collisionObjects
      @ctx.save()
      @ctx.translate object.collision.x, object.collision.y
      @ctx.fillStyle = '#1c1915'
      @ctx.fillRect 0, 0, object.collision.width, object.collision.height
      @ctx.restore()

    if @debug
      @ctx.save()
      @ctx.translate @player.collision().x, @player.collision().y
      @ctx.fillStyle = 'red'
      @ctx.fillRect 0, 0, @player.collision().width, @player.collision().height
      @ctx.restore()

    @ctx.save()
    @ctx.translate @player.pos.x, @player.pos.y

    @player.draw @ctx
    @ctx.restore()

    @ctx.restore()
    @ctx.restore()

    @ctx.fillStyle = 'black'
    @ctx.fillRect 0, atom.height-@verticalMargin, atom.width, atom.height - (atom.height-@verticalMargin)


    sideMargin = (atom.width-@width)/2
    leftGrad = @ctx.createLinearGradient 0, 0, sideMargin, 0
    rightGrad = @ctx.createLinearGradient (atom.width - sideMargin), 0, sideMargin + (atom.width - sideMargin), 0

    leftGrad.addColorStop 0, 'rgba(0,0,0,1)'
    leftGrad.addColorStop 1, 'rgba(0,0,0,0)'

    rightGrad.addColorStop 0, 'rgba(0,0,0,0)'
    rightGrad.addColorStop 1, 'rgba(0,0,0,1)'

    @ctx.fillStyle = leftGrad

    @ctx.fillRect 0, 0, sideMargin, atom.height

    @ctx.fillStyle = rightGrad

    @ctx.fillRect (atom.width - sideMargin), 0, sideMargin, atom.height
