import "@babylonjs/core/Debug/debugLayer";
import "@babylonjs/inspector";
import "@babylonjs/loaders/glTF";
import "./App.css";

import { Engine, Scene, ArcRotateCamera} from "@babylonjs/core";
import { Vector3, HemisphericLight, Mesh, MeshBuilder } from "@babylonjs/core";
import {Primary} from "./scenes/Primary";

class App {
    constructor() {

        // create the canvas html element and attach it to the webpage
        var canvas = document.createElement("canvas");
        canvas.style.width = "100%";
        canvas.style.height = "100vh";
        canvas.id = "gameCanvas";
        document.body.appendChild(canvas);

        document.body.insertAdjacentHTML('beforeend','<div id="tellme" style="position:absolute;top:0; left:0;color:white;z-index: 10000;">TEST</div>')


        // initialize babylon scene and engine
        var engine = new Engine(canvas, true);
        var currentScene = new Primary( engine, canvas )

        // run the main render loop
        engine.runRenderLoop(() => {
            currentScene.render();
        });
    }
}

new App();
