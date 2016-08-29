package main

type NotificationCounter struct {
	Requests  chan interface{}
	Responses chan int
}

func NewNotificationCounter() *NotificationCounter {
	var nc NotificationCounter
	nc.Requests = make(chan interface{})
	nc.Responses = make(chan int)
	N := 0
	go func() {
		for {
			select {
			case <-nc.Requests:
				nc.Responses <- N
				N++
			}
		}
	}()
	return &nc
}

func (nc *NotificationCounter) GetNew() int {
	nc.Requests <- true
	return <-nc.Responses
}
