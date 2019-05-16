import initApi from './api';

const hex2a = (hexx) => {
  var hex = hexx.toString();//force conversion
  var str = '';
  for (var i = 0; (i < hex.length && hex.substr(i, 2) !== '00'); i += 2)
    str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
  return str;
}

export const pollAllEvents = async (remoteNodeUrl?: string) => {
  // get event filters
  const eventsFilter = getEventSections();
  // get api
  const api = await initApi(remoteNodeUrl);
  api.rpc.chain.subscribeNewHead(async (header) => {
    const events = await api.query.system.events.at(header.hash);
    await handleEventSubscription(events);
  });
}

const handleEventSubscription = async (events) => {
  // get event filters
  const eventsFilter = getEventSections();
  events.forEach(async (record) => {
    // extract the event object
    const { event, phase } = record;
    // parse event object
    const eventObj = {
      section: event.section,
      method: event.method,
      meta: event.meta.documentation.toString(),
      data: event.data.toString()
    }
    // remove this log if not needed
    console.log('Event Received: ' + Date.now() + ": " + JSON.stringify(eventObj));
    // emit event identifier

  });
};
