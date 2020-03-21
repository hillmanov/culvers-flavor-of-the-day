import React from 'react';
import { map, filter } from 'lodash';
import './app.css';
import { observer } from 'mobx-react';
import { types, flow } from 'mobx-state-tree';
import axios from 'axios';
import dayjs from 'dayjs';
import advancedFormat from 'dayjs/plugin/advancedFormat';
import classNames from 'classnames';
dayjs.extend(advancedFormat)

const {
  model,
  optional,
  array,
  enumeration,
  string,
} = types;

const FlavorOfTheDay = model('FlavorOfTheDay', {
  date: string,
  flavor: string,
  image: string,
});

const AppController = model('AppController', {
  state: optional(enumeration(['loading', 'loaded', 'error']), 'loading'),
  currentDate: optional(string, dayjs().format('YYYY-MM-DD')),
  filter: optional(enumeration(['all', 'thisMonth', 'restOfThisMonth', 'nextMonth', 'today']), 'restOfThisMonth'),
  flavorsOfTheDay: array(FlavorOfTheDay)
})
.actions(self => ({
  afterCreate() {
    self.getFlavorsOfTheDay();
  },
  getFlavorsOfTheDay: flow(function* getFlavorsOfTheDay() {
    self.state = 'loading';
    try {
      const { data: flavorsOfTheDay } = yield axios.get('/api');
      self.flavorsOfTheDay = flavorsOfTheDay;
      self.state = 'loaded';
    } catch (e) {
      console.error(e);
      self.state = 'error';
    }
  }),
  setFilter(filter) {
    self.filter = filter;
  }
}))
.views(self => ({
  get filterdFlavorsOfThDay() {
    switch (self.filter) {
      case 'all':
        return self.flavorsOfTheDay;
      case 'thisMonth':
        return filter(self.flavorsOfTheDay, ({ date }) => {
          return dayjs(date).isBefore(dayjs().endOf('month'));
        });
      case 'restOfThisMonth':
        return filter(self.flavorsOfTheDay, ({ date }) => {
          return (dayjs(date).isSame(dayjs(self.currentDate)) || dayjs(date).isAfter(dayjs(self.currentDate))) && dayjs(date).isBefore(dayjs().endOf('month'));
        });
      case 'today':
        return filter(self.flavorsOfTheDay, ({ date }) => {
          return dayjs(date).isSame(dayjs(self.currentDate));
        });
      case 'nextMonth':
        return filter(self.flavorsOfTheDay, ({ date }) => {
          return dayjs(date).isAfter(dayjs().endOf('month'))
        });
      default: 
        return null;
    }
  },
  get content() {
    return self[self.state];
  },
  get loading() {
    return (
      <div>Loading...</div>
    );
  },
  get loaded() {
    return map(self.filterdFlavorsOfThDay, ({ date, flavor, image }) => {
      const current = date === self.currentDate;
      return (
        <div className={classNames('flavorOfTheDay', { current })}  key={date}>
          <div className="date">{dayjs(date).format('MMMM Do')} {current ? '(Today)' : ''}</div>
          <div className="flavor">{flavor}</div>
          <img className="image" alt={flavor} src={image} />
        </div>
      )
    });
  },
  get error() {
    return (
      <div>Error</div>
    );
  },
}));

class App extends React.Component {
  constructor(props) {
    super(props);
    this.c = AppController.create();
  }

  render() {
    return (
      <div className={'app'}>
        <div className="filters">
          <div className={classNames('filter', { active: this.c.filter === 'all'})} onClick={() => this.c.setFilter('all')}>All</div>
          <div className={classNames('filter', { active: this.c.filter === 'thisMonth'})} onClick={() => this.c.setFilter('thisMonth')}>This Month</div>
          <div className={classNames('filter', { active: this.c.filter === 'restOfThisMonth'})} onClick={() => this.c.setFilter('restOfThisMonth')}>Rest of Month</div>
          <div className={classNames('filter', { active: this.c.filter === 'nextMonth'})} onClick={() => this.c.setFilter('nextMonth')}>Next Month</div>
          <div className={classNames('filter', { active: this.c.filter === 'today'})} onClick={() => this.c.setFilter('today')}>Today</div>
        </div>
        {this.c.content}
      </div>
    );
  }
};

export default observer(App);
