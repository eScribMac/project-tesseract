import { bullets, player, testText, gameMaster, teamBullet } from './create.js';
import { playerCollide, bulletCollide } from './createMap.js';
import { gmMonsters } from '../controls/gameMasterControls.js';
import store from '../../store.js';
import { updateMonsters } from '../../reducers/monsters.js';
import { teammateUpdate, LocalTeammates } from './teammateUpdate.js';
import { shallowMonsterUpdate } from './shallowMonsterUpdate.js';
// import { updateHealth } from '../../reducers/players.js';

export default function update() {
  //test text
  let time = store.getState().game.time;
  testText.setText(time);
  if (time[0] === '0' && time[1] === '0') testText.setStyle({ font: "24px Arial", fill: "#ff0044", align: "center" });
  // this.game.paused = true
  //  Collision

  // console.log(store.getState());

  // Checks which gameMode was chosen and updates appropriately
  if (store.getState().gameMode === 'survivor') {
    player.update();
    teammateUpdate.call(this, player);
    this.physics.arcade.collide(player.sprite, playerCollide)
    this.physics.arcade.collide(bullets.sprite, bulletCollide, (bullet) => {
      bullet.kill();
    });

    // draw the monsters
    shallowMonsterUpdate.call(this, player);

  } else if (store.getState().gameMode === 'gamemaster') {
    gameMaster.update();
    teammateUpdate.call(this, 'gm');
  }

  if (this.input.activePointer.isDown) {
        if (this.origDragPoint) {
            // move the camera by the amount the mouse has moved since last update
            this.game.camera.x += this.origDragPoint.x - this.input.activePointer.position.x;
            this.game.camera.y += this.origDragPoint.y - this.input.activePointer.position.y;
        }
        // set new drag origin to current position
        this.origDragPoint = this.input.activePointer.position.clone();
    }
    else {
        this.origDragPoint = null;
    }


  //player win
  if (store.getState().game.timeUp) {
      let winMessageText = 'SURVIVORS WIN';
      let winMessageStyle = { font: '96px Arial', fill: '#ff0044', align: 'center' };
      let winMessage = this.add.text(240, 300, winMessageText, winMessageStyle)
      winMessage.fixedToCamera = true
      this.game.paused = true
   }

  //handle gmMonsters
  //#gamemaster - maybe? not sure how this logic is going to work
  let monstersToDispatch = {};
  for (let id in gmMonsters) {
    let tempMonster = {health: gmMonsters[id].sprite.health, x: gmMonsters[id].sprite.x, y: gmMonsters[id].sprite.y, animation: gmMonsters[id].animation};
    monstersToDispatch[id] = tempMonster;

    //variables for pathfinding
    let closest;
    let distanceToClosest = 0;
    //iterating through teammates
    for (let teammateID in LocalTeammates) {
    //gmMonsters collide with player
      this.physics.arcade.collide(gmMonsters[id].sprite, LocalTeammates[teammateID]);

    //choose the closest survivor and path to them
      if (LocalTeammates[teammateID].sprite) {
        let currentDistance = Phaser.Math.distance(gmMonsters[id].sprite.x, gmMonsters[id].sprite.y, LocalTeammates[teammateID].sprite.x, LocalTeammates[teammateID].sprite.y);
        if (currentDistance > distanceToClosest) {
          distanceToClosest = currentDistance;
          closest = LocalTeammates[teammateID];
        }
      }
    }

    //gmMonsters path to the player
    if (closest) gmMonsters[id].update(closest.sprite.x, closest.sprite.y);

    //gmMonsters collide with map
    this.physics.arcade.collide(gmMonsters[id].sprite, playerCollide);

    //gmMonsters collide with each other
    for (let otherIDs in gmMonsters) {
        if (id !== otherIDs) {
            this.physics.arcade.collide(gmMonsters[id].sprite, gmMonsters[otherIDs].sprite);
        }
    }

    //gmMonsters collide with bullets and deal damage
    this.physics.arcade.collide(teamBullet.sprite, gmMonsters[id].sprite, (monster, bullet) => {
      bullet.kill();
      monster.health -= 20;
      if (monster.health <= 0 ) {
        monster.kill();
        monster.healthBar.kill();
        delete gmMonsters[id];
      }
    });
  }
  store.dispatch(updateMonsters(monstersToDispatch));
}
