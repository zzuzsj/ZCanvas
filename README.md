# ZCanvas
    Mark:ZCanvas is a canvas class used for rendering shapes into canvas in a trail.We always need to use `requestAnimationFrame` to create a animation for canvas doms.And ZCanvas helps you to complete the animation easier. 
----
Simple Use  
  If you want to create a rect shape and make it move to one point in a linear way , you can achieve it by follow steps.

* Create the a canvas in HTML  
We should know that ZCanvas is related to canvas dom . So we must create a canvas node in HTML first.   
```javascript
    <canvas id="board" width="500" height="500"></canvas>
```
* Create an instance of ZCanvas  
We should get the canvas node as a param and new an instance of ZCanvas.  
```javascript
    var board = document.getElementById("board");
    var zcanvas = new ZCanvas(board);
```
* Create a rect shape  
In ZCanvas , we can create a rect shape as soon as possible :  
```javascript
    var rect = zcanvas.Rect();
```
Or you can appiont styles for the rect just as you want :  
```javascript
    var rect = zcanvas.Rect({
        width : 100,
        height :100,
        x : 0,
        y : 0,
        orignX : 0,
        orignY : 0,
        fill : "#000",
        shadow : true,
        shadowBlur : 2,
        shadowColor : "#333",
        shadowOffsetX : 0,
        shadowOffsetY : 0,
        stroke : true,
        strokeStyle : "#666",
        strokeWidth : 2,
        rotate : Math.PI,
        scaleX : 1,
        scaleY : 1,
        opacity : 1
    });
```
* Add and render the rect node into canvas  
Have created the node , we should add the node into zcanvas and then render it to make it visible . Shape can't be rendered if is was not added .  
```javascript
    zcanvas.addNode(rect);
    zcanvas.renderNode(rect);
```
And then you will see the rect in the canvas .  
However , you can add animations when the node is rendered into the canvas , just as follow code :
```javascript
    zcanvas.renderNode(rect,{
        type:"linear",
        time:200,
        delay:100
    },{
        width:200,
        height:200,
        x:300,
        y:300
    },function(){
        console.log("Rendering Completed")
    });
```
(The step time is the same as requestAnimationFrame's step time .) The code means in 100 steps later,the rect node will animate from the added style to the rendered style in 200 steps . And you can give a callback after the animation finished  . 
* Derender the rect and remove it away  
You can also derender the rect in an animation and remove it after derendered . 
```javascript
    zcanvas.deRenderNode(rect,{
        type:"linear",
        time:200,
        delay:100
    },{
        width:200,
        height:200,
        x:300,
        y:300
    },function(){
        zcanvas.removeNode(rect);
    });
```
But I guess you may be need to remove the node in the callback of derenderring if you want to perform a animation . Because the node can't be remove if it has not been derenderred from the zcanvas .

----
Summary:  
It's sorry to say that ZCanvas is not all completed yet . But I'll let it completed as soon as possible .
