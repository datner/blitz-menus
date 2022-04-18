import { faker } from "@faker-js/faker"
import db, { Locale } from "./index"

/*
 * This seed function is executed when you run `blitz db seed`.
 *
 * Probably you want to use a library like https://chancejs.com
 * to easily generate realistic data.
 */
const seed = async () => {
  console.log("start seeding....")
  console.log("creating random-eats")

  const rnd = await db.restaurant.create({
    data: {
      slug: "random-eats",
      logo: "random-eats.png",
      content: {
        create: {
          name: faker.company.bsNoun(),
          locale: Locale.en,
        },
      },
    },
  })

  for (let i = 0; i < 5; i++) {
    const type = faker.unique(faker.animal.type)
    const cat = await db.category.create({
      data: {
        identifier: type,
        restaurant: { connect: { id: rnd.id } },
        content: {
          create: {
            locale: Locale.en,
            name: type,
          },
        },
      },
    })
    for (let i = 0; i < 10; i++) {
      if (type in faker.animal) {
        const breed = faker.unique(
          type in faker.animal ? faker.animal[type] : faker.animal.cat
        ) as string
        await db.item.create({
          data: {
            identifier: breed,
            restaurant: { connect: { id: rnd.id } },
            category: { connect: { id: cat.id } },
            image: `${breed}.png`,
            price: faker.datatype.number(100),
            content: {
              create: {
                locale: Locale.en,
                name: breed,
                description: faker.lorem.sentence(),
              },
            },
          },
        })
      }
    }
  }

  console.log("creating jenia...")
  const jenia = await db.restaurant.create({
    data: {
      slug: "jenia",
      logo: "jenia.png",
      content: {
        createMany: {
          data: [
            {
              name: "Jenia",
              locale: Locale.en,
            },
            {
              name: "ג׳ניה",
              locale: Locale.he,
            },
          ],
        },
      },
    },
  })

  console.log("creating menu...")
  const menu = await db.menu.create({
    data: {
      identifier: "jenia-menu-default",
      restaurant: { connect: { id: jenia.id } },
    },
  })

  console.group("creating categories...")
  const drinks = await db.category.create({
    data: {
      identifier: "jenia-category-drinks",
      restaurant: { connect: { id: jenia.id } },
      menu: { connect: { id: menu.id } },
      content: {
        createMany: {
          data: [
            {
              name: "Drinks🥤",
              locale: Locale.en,
            },
            {
              name: "משקאות🥤",
              locale: Locale.he,
            },
          ],
        },
      },
    },
  })
  console.log("Drinks 🥤 Created!")
  const beers = await db.category.create({
    data: {
      identifier: "jenia-category-beers",
      restaurant: { connect: { id: jenia.id } },
      menu: { connect: { id: menu.id } },
      content: {
        createMany: {
          data: [
            {
              name: "Beers 🍺",
              locale: Locale.en,
            },
            {
              name: "בירות 🍺",
              locale: Locale.he,
            },
          ],
        },
      },
    },
  })
  console.log("Beers 🍺 Created!")
  console.groupEnd()

  console.group("creating items...")
  await db.item.create({
    data: {
      identifier: "coka-cola",
      restaurant: { connect: { id: jenia.id } },
      category: { connect: { id: drinks.id } },
      image: "coke.png",
      price: 13,
      content: {
        createMany: {
          data: [
            {
              name: "Coca-Cola",
              description: "The original taste",
              locale: Locale.en,
            },
            {
              name: "קוקה קולה",
              description: "יאמי יאמי קוקה קולה",
              locale: Locale.he,
            },
          ],
        },
      },
    },
  })
  console.log("Coca-Cola created!")

  await db.item.create({
    data: {
      identifier: "fanta",
      restaurant: { connect: { id: jenia.id } },
      category: { connect: { id: drinks.id } },
      image: "fanta.png",
      price: 13,
      content: {
        createMany: {
          data: [
            {
              name: "Fanta",
              description: "Orangy and Refreshing",
              locale: Locale.en,
            },
            { name: "פנטה", description: "בטעם תפוז מרענן", locale: Locale.he },
          ],
        },
      },
    },
  })
  console.log("Fanta created!")

  await db.item.create({
    data: {
      identifier: "soda",
      restaurant: { connect: { id: jenia.id } },
      category: { connect: { identifier: drinks.identifier } },
      image: "soda.png",
      price: 11,
      content: {
        createMany: {
          data: [
            {
              name: "Soda",
              description: "Bubbly and smooth",
              locale: Locale.en,
            },
            { name: "סודה", description: "לזקנים", locale: Locale.he },
          ],
        },
      },
    },
  })
  console.log("Soda created!")

  await db.item.create({
    data: {
      identifier: "goldstar",
      restaurant: { connect: { id: jenia.id } },
      category: { connect: { identifier: beers.identifier } },
      image: "fanta.png",
      price: 27,
      content: {
        createMany: {
          data: [
            {
              name: "Goldstar",
              description: "Classic Israeli Beer",
              locale: Locale.en,
            },
            { name: "גולדסאטר", description: "", locale: Locale.he },
          ],
        },
      },
    },
  })
  console.log("Goldstar created!")

  await db.item.create({
    data: {
      identifier: "heiniken",
      restaurant: { connect: { id: jenia.id } },
      category: { connect: { identifier: beers.identifier } },
      image: "fanta.png",
      price: 27,
      content: {
        createMany: {
          data: [
            {
              name: "Heiniken",
              description: "Probably the best beer in the world",
              locale: Locale.en,
            },
            {
              name: "הייניקן",
              description: "בירה בסדר כזה",
              locale: Locale.he,
            },
          ],
        },
      },
    },
  })
  console.log("Heiniken created!")
  await db.item.create({
    data: {
      identifier: "goldstar-unfiltered",
      restaurant: { connect: { id: jenia.id } },
      category: { connect: { identifier: beers.identifier } },
      image: "fanta.png",
      price: 27,
      content: {
        createMany: {
          data: [
            {
              name: "Goldstar",
              description: "Classic Israeli Beer",
              locale: Locale.en,
            },
            { name: "גולדסאטר", description: "", locale: Locale.he },
          ],
        },
      },
    },
  })
  console.log("Goldstar Unfiltered created!")
  console.groupEnd()
}

export default seed
