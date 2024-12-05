import React from 'react'

import paris from '../../assets/paris.jpg'
import london from '../../assets/london.jpg'
import NewYork from '../../assets/NewYork.jpg'
import traveler1 from '../../assets/traveler1.jpg'
import traveler2 from '../../assets/traveler2.jpg'
import traveler3 from '../../assets/traveler3.jpg'

//Implement array method called Map to display all the data
const travelers = [
  {
    id: 1,
    destinationImage: paris,
    travelerImage: traveler1,
    travelerName: 'IsraTech',
    socialLink: '@isratech8'
  },
  {
    id: 2,
    destinationImage: london,
    travelerImage: traveler2,
    travelerName: 'Wilson Lindsey',
    socialLink: '@wilsonlindsey'
  },
  {
    id: 3,
    destinationImage: NewYork,
    travelerImage: traveler3,
    travelerName: 'Jason',
    socialLink: '@jason88'
  }
]


const Travelers = () => {
  return (
    <div className="travelers container section">
      <div className="sectionContainer">
        <h2>
          Top travelers of this month!
        </h2>

        <div className="travelersContainer grid">
          {/* Single passanger card*/}
          {
            travelers.map(({id, destinationImage, travelerImage, travelerName,socialLink})=>{
              return(
                <div key={id} className="singleTraveler">
                  <img src={destinationImage} className='destinationImage'/>
      
                  <div className="travelerDetails">
                    <div className="travelerPicture">
                      <img src={travelerImage} className="travelerImage"/>
                    </div>
                    <div className="travelerName">
                      <span>{travelerName}</span>
                      <p>{socialLink}</p>
                    </div>
                  </div>
                </div>
              )
            })
          }


        </div>
      </div>
    </div>
  )
}

export default Travelers