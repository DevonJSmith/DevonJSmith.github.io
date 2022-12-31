---
title: Lootbox Simulator
date: 2020-03-30
tags: [angular, projects]
path: blog/lootbox-simulator
cover: ./lootboxsimulator.png
excerpt: An Angular application that generates lootbox items with random seeds
---

# LootboxSimulator
[Github Link](https://github.com/DevonJSmith/lootbox-simulator)

## Introduction
This project is an Angular Single-Page Application based on the concept of "lootboxes", random virtual rewards commonly found in video games. The goal of this project is to recreate the anticipation and uniqueness of opening such a reward with interesting random items.

<img src="https://imgur.com/UfCicGg.png" alt="lootbox before reveal" width="500px" />  

<img src="https://imgur.com/nxgX0xa.png" alt="lootbox after reveal" width="500px" />

A working demo of this project can be found [here.](https://devonjsmith.github.io/lootbox-simulator/.) 

## Technologies Leveraged
- [Angular v9.x](https://angular.io/)
- [Material UI](https://material.angular.io/)
- Libraries / npm Packages
  - [Faker.js](https://github.com/marak/Faker.js/)
  - [Lorem Picsum](https://picsum.photos/)
  - [Angular Flex-Layout](https://github.com/angular/flex-layout)
  - [ngx-clipboard](https://www.npmjs.com/package/ngx-clipboard)

## Core Functionality
In a typical use case, the user will navigate to the root of the application (ex: https://devonjsmith.github.io/lootbox-simulator/) which will then navigate to a randomly generated sub-route. 

<img src="https://imgur.com/YCZ6jXQ.png" alt="example of generated url" width="500px" />

Clicking the "Reveal" button on the card will fade in the "back" of the card to reveal the randomly generated lootbox item, which consists of a random title, a random image, and a random phrase/description.

<img src="https://imgur.com/qcyOHQc.png" alt="the generate new button" width="500px" />  

Clicking the "Generate New Lootbox" will redirect the browser to the application root and generate a new seed and lootbox. 

The "Shareable Link" textbox gives a convenient text-box with the current absolute URL. Clicking the "Copy" button will automatically copy the contents to the clipboard.

<img src="https://imgur.com/fNwnVr5.png" alt="link copied" width="500px" />

The application uses a random seed system so that each unique URL will always give the same result (ex: [This link](https://devonjsmith.github.io/lootbox-simulator/lootbox/PZ5LkRx0)  will always generate "Handcrafted Granite Soap" with the image of a starry night sky). This allows a user to save or reproduce an interesting result, while also allowing the user to get random results by navigating to the application root.

The `LandingSeedGeneratorComponent` serves as the application root. Its only function is to generate a random seed (using the `Faker.js` "password" functionality) and navigate to the `/lootbox/` route with the generated seed as a route parameter:
```typescript
ngOnInit(): void {
    // use faker library to generate a seed
    const seed = faker.internet.password(8);
    // route to the lootbox home using the seed
    this.router.navigate([`/lootbox/${seed}`]);
  }
```

The `LootboxHomeComponent` will parse the seed from the URL, which is then passed to the `LootBoxService` to generate the lootbox items, ensuring that results are consistent for corresponding seeds:
```typescript
ngOnInit() {
    // get the seed from the URL, if possible
    const seedParameter = this.route.paramMap.subscribe(params => {
      if (params.get('seed')) {
        this.seed = params.get('seed');
      }

      this.GenerateLootBoxItems();
    });
  }

  GenerateLootBoxItems() {
    this.lootBoxItems = [];
    for (let i = 0; i < this.itemNumber; i ++) {
      this.lootBoxService.generateLootboxItem(this.seed).subscribe(x => {
        this.lootBoxItems.push(x);
      });
    }
  }
```

The `LootboxItemService` `generateLootboxItem` method will parse the passed in seed into a number (by converting each character to its ASCII value) and pass the resulting number to the `RandomTextService` and the `RandomImageService` in order to return the `Observable<LootBoxItemModel>`

```typescript
public generateLootboxItem(seed: string | null): Observable<LootBoxItemModel> {
    const numberSeed = this.generateSeed(seed);

    return new Observable(subscriber => {
      subscriber.next({
        name: this.randomTextService.getRandomName(numberSeed),
        description: this.randomTextService.getRandomDescription(numberSeed),
        imgUrl: this.randomImageService.getRandomImgUrl(numberSeed),
        flipped: false
      });
    });
  }

  private generateSeed(seed: string | null): number {
    let seedString = seed;
    if (!seedString) {
      seedString = faker.internet.password(8);
    }

    // convert password to ascii code
    let asciiString = '';
    for (let i = 0; i < seedString.length; i ++) {
      asciiString += seedString.charCodeAt(i).toString(10);
    }

    return Number.parseInt(asciiString, 10);
  }
```


## Retrospective
### Problems Encountered
#### Using the Faker.js Library  
Random image generation in the current release of `Faker.js` is broken. The library still relies on `Lorem-Pixel` API, which has been deprecated and is no longer functional. There is a [pull request open](https://github.com/Marak/faker.js/pull/855) for the Faker.js library to use the [`Lorem Picsum`](https://picsum.photos/) api, but the stable branch does not have this merged.  

  `Lorem Picsum` [does have an angular library](https://www.npmjs.com/package/lorem-picsum), however this does not provide support for the `seed` functionality, so I wasn't able to use it for this project (I may revist this issue later in another project).

  Lastly, the `seed` functionality of `Faker.js` only accepts a `number` value, which is why the generated string needed to be converted using the ASCII values.

#### Ngx-Flip
Initially, my vision for opening the lootbox items would be akin to flipping over a card to "reveal" the contents underneath. To this end, I tried implementing the project using the [ngx-flip library](https://www.npmjs.com/package/ngx-flip), however I noticed visual bugs when combing this with `flex boxes`:

<img src="https://imgur.com/vH477vq.png" alt="example of issues with ngx-flip" width="500px" />

I ended up replacing the "flip animation" with a simple fade in/out animation, inspired by [this StackOverflow comment](https://stackoverflow.com/a/36417971).

### Lessons Learned
#### Angular Animations
After replacing the `ngx-flip` package and deciding to use Angular animations instead, I looked into reusing Animations in a robust way. I found [this article in the Angular documentation](https://angular.io/guide/reusable-animations#creating-reusable-animations) which covered this exact topic, and I ended up with a exported animation like this:
```typescript
import { animation, trigger, transition, style, animate } from '@angular/animations';

export const FadeInAnimation = animation([
    style({opacity: 0}),
    animate('{{ duration }}', style({opacity: 1}))
]);

export const FadeOutAnimation = animation([
    animate('{{ duration }}', style({opacity: 0}))
]);

```

And I was able to implement them into the `LootBoxHome` and `LootBoxItem` components like this:
```typescript
@Component({
  selector: 'app-lootbox-home',
  templateUrl: './lootbox-home.component.html',
  styleUrls: ['./lootbox-home.component.css'],
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [
        useAnimation(FadeInAnimation, {
          params: {
            duration: '900ms'
          }
        })
      ]),
      transition(':leave', [
        useAnimation(FadeOutAnimation, {
          params: {
            duration: '900ms'
          }
        })
      ])
    ])
  ]
})
```
I added the `duration` parameter so that the animations could be re-used across components, but the length of the animation could be adjusted independently for each component.
#### Github Pages and Angular
I knew before starting this project that I wanted it to eventually be hosted on Github Pages. I already this personal website (https://devonjsmith.github.io) hosted by Github so I figured it would be much the same process for hosting an Angular application.

However, I did encounter some issues with building the Angular application in production mode and getting the es5 bundles to generate properly. I eventually moved to the [angular-cli-ghpages](https://www.npmjs.com/package/angular-cli-ghpages) plugin, which conveniently builds the project for production onto a new `gh-pages` branch. From there, it's just a matter of modifying the settings for the github project.

<img src="https://imgur.com/h0O2tc2.png" alt="github pages configuration" width="500px" />

### Possible Improvements
#### Multiple Lootbox Items
My initial concept for this project included multiple lootbox items that would each need to be revealed one after another. I was inspired by the "card pack" opening mechanics in several free-to-play card games:

<img src="https://preview.redd.it/quxy6gfi3rd21.png?width=960&crop=smart&auto=webp&s=2b2c522c35dddb4e226d24aba57ecacee620fc9b" alt="gwent card keg opening" width="500px" />  

*Image source: [reddit.com/r/gwent](https://www.reddit.com/r/gwent/comments/alowj0/base_kegs_can_now_drop_premium_starter_cards/)*

<img src="https://i.imgur.com/J70DR2U.jpg" alt="heartstone card pack" width="500px" />  

*Image source: [reddit.com/r/HSPulls](https://www.reddit.com/r/HSPulls/comments/34ktj6/best_card_pack_ive_ever_opened_xpost_from/)*

In order to allow multiple lootbox items to be generated, I would need to develop a system to generate `n` possible numerical seeds from a single string seed. This is because I would like to keep the functionality where each unique URL produces consistent results, while still keeping an interesting amount of randomness. 

## Conclusion
This project was an enjoyable Angular experiment. I was impressed by the functionality of the `Faker.js` library, though I do feel that a more complicated random system for generating the lootbox content could improve the system.

This project was a good opportunity to learn about Angular animations and deploying strategies for Github pages. 

The UI and layout of this project were made very convenient by the `Material` and `Angular-flex` libraries. I am eager to see how my UI/UX design could improve in the future with more experience.
