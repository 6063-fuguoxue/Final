# Final Project
## Milestone 1: Project Ideas

This week, I generated 3 ideas for my final project development. 

### Idea 1: Friendly Printer
The inspiration for this project comes from two memes I found online: 

| Meme 1      | Meme 2 |
| ----------- | ----------- |
| ![](./imgs/idea1-meme1.jpg)      | ![](./imgs/idea1-meme2.jpg)      |
| The flower says "Please be my friend. "   | The flower says "Please chat with me. "        |

I somehow resonate with the flowers in the memes. I always want to make new friends and chat with people, but I can be very introverted sometimes and don't know how to start a conversation. Therefore, I am wondering if a machine can act as a medium to have a conversation with even a stranger I've never met before. Below is my ideation of the project. 

![](./imgs/idea1-1.jpg)

I plan to use a receipt printer because the machine and the receipt paper are relatively cheap and easy to buy. The process of receipt printing is also interesting to watch. 

![](./imgs/idea1-2.jpg)

During the conversation, the printer appears very talkative, while the player can only choose from two responses: positive or negative. This is also an interesting reversal between human and machine, as human usually has more flexible and complex language system than machine. 

![](./imgs/idea1-3.jpg)

A conversation will end after several lines. I will further design the visuals during the conversation but here is a very simple one to illustrate the idea. Upon each response, the corresponding area on the screen will grow in size. However, the two colors get more and more similar to each other. When the screen is purely in one color, the machine will say goodbye to the player and tell the player: "You are the No. XX friend I've met today. Thank you so much for accompanying me. Have a nice day..."

Players can tear the receipt away at the end of a conversation. 

In this project, p5.js can handle the visuals on the screen, while the receipt printer and the two buttons can be controlled by Arduino. Serial communication between Arduino and p5.js is needed. [This tutorial](https://blog.arduino.cc/2023/05/20/control-a-thermal-printer-with-your-arduino/) seems very helpful for me to control a thermal printer using an Arduino. 

### Idea 2: Rhythm at Fingertips

This project is inspired by [this video](https://www.youtube.com/watch?v=BboivOblV-A). Below is a sketch of my idea. 

![](./imgs/idea2.jpg)

The project invites people to create music by making their fingertips touch. To track hands, we just need a webcam and ml5.js library. The visuals on the screen and music can be handled by p5.js. While the music is being generated, an LED matrix controlled by an Arduino board will function as a physical visualization of music. 

The logic of this project should be simple and I've done similar things in my previous project. I think the main challenge would be how to make the music visualization attractive and replayable. 

### Idea 3: Weather Board

As the weather is getting cold in New York and the temperature difference within a day can be up to 10 celsius degrees, I always need to check on my phone so I know what to wear before going out. Therefore, I want to make a real-time weather data visualization interface that is more intuitive to view and interact with. 

![](./imgs/idea3.jpg)

When a person gets close to the interface, it will light up and show weather information. This can be achieved by a sensor controlled by an Arduino board. The interface will recognize my gesture of swiping left or right to show me the past or future temperature. This can be achieved by ml5.js library. As for fetching and processing the real-time weather data, I found tutorials like [this one](https://www.youtube.com/watch?v=PhDPnjF3_tA) helpful. 

The Weather APP on iPhones can be a good reference for what information to include in my Weather Board. 
