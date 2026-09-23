import Phaser from 'phaser';
import { RoomScene } from './room';
import './style.css';
new Phaser.Game({type:Phaser.AUTO,parent:'game-container',width:1024,height:880,transparent:true,antialias:true,scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},scene:[RoomScene]});
