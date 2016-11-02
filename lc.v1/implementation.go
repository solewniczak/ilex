package lc

import (
	"fmt"
	"gopkg.in/mgo.v2"
	//"gopkg.in/mgo.v2/bson"
	"ilex/ilex"
)

type TwoWayLinkContainer struct {
	Links    []ilex.TwoWayLink
	ToDelete []ilex.TwoWayLink
}

func (c TwoWayLinkContainer) Len() int      { return len(c.Links) }
func (c TwoWayLinkContainer) Swap(i, j int) { c.Links[i], c.Links[j] = c.Links[j], c.Links[i] }
func (c TwoWayLinkContainer) Less(i, j int) bool {
	return c.Links[i].From.Range.Position < c.Links[j].From.Range.Position
}

func isAmongLinks(link *ilex.TwoWayLink, linkIds []string) bool {
	idAsString := link.Id.Hex()
	for _, linkId := range linkIds {
		if idAsString == linkId {
			return true
		}
	}
	return false
}

func (lc *TwoWayLinkContainer) print() {
	fmt.Println("Link container contents:")
	for _, link := range lc.Links {
		fmt.Printf("\t[%4d,\t%4d]\n", link.From.Range.Position, link.From.Range.Position+link.From.Range.Length-1)
	}
	fmt.Printf("+ %d links to delete.\n", len(lc.ToDelete))
}

func (lc *TwoWayLinkContainer) AddRunes(position, length int, linkIds []string) {
	for i, link := range lc.Links {
		if link.From.Range.Position <= position && link.From.Range.Position+link.From.Range.Length >= position && isAmongLinks(&link, linkIds) {
			lc.Links[i].From.Range.Length += length
		} else if link.From.Range.Position >= position {
			// link is shifted right
			lc.Links[i].From.Range.Position += length
		}
	}
	lc.print()
}

func (lc *TwoWayLinkContainer) RemoveRunes(position, length int) (removed []ilex.TwoWayLink) {
	removed = make([]ilex.TwoWayLink, 0)
	writeIndex := 0
	for _, link := range lc.Links {
		leftPosition := link.From.Range.Position
		linkLength := link.From.Range.Length
		rightPosition := link.From.Range.Position + linkLength - 1
		if leftPosition >= position && rightPosition <= position+length-1 {
			// the link is wholly contained in the removed section. It's thus
			// removed
			removed = append(removed, link)
			lc.ToDelete = append(lc.ToDelete, link)
		} else {
			if rightPosition < position {
				// the removed section is after the link. Do nothind
			} else if leftPosition > position+length-1 {
				//the link and the section is before the link
				link.From.Range.Position -= length
			} else if leftPosition > position {
				// the removed section starts before the link
				link.From.Range.Position = position
				link.From.Range.Length = linkLength - (position + length - leftPosition)
			} else if rightPosition >= position+length-1 {
				// the removed section begins somewhere in the link, but does
				// not extend after it
				link.From.Range.Length -= length
			} else if position+length >= rightPosition {
				// the removed section begins somewhere in the link,
				// and extends after it
				link.From.Range.Length = linkLength - (rightPosition - position + 1)
			} else {
				fmt.Println("Error! Link container encountered an unexpected condition!")
			}
			lc.Links[writeIndex] = link
			writeIndex++
		}
	}
	if writeIndex+len(removed) != len(lc.Links) {
		fmt.Println("Error! Link container is losing links!")
	}
	lc.Links = lc.Links[:writeIndex]
	lc.print()
	return removed
}

func (lc *TwoWayLinkContainer) Persist(db *mgo.Database) error {
	//var err error
	links := db.C(ilex.LINKS)
	bulk := links.Bulk()
	updates := make([]interface{}, 2*len(lc.Links))
	for i, link := range lc.Links {
		updates[2*i] = link.Id
		updates[2*i+1] = link
	}
	bulk.Update(updates...)
	bulk.Run()
	deletes := make([]interface{}, len(lc.ToDelete))
	for i, link := range lc.ToDelete {
		deletes[i] = link.Id
	}
	bulk.Remove(deletes...)
	bulk.Run()
	lc.ToDelete = lc.ToDelete[:0]
	return nil
}

func (lc *TwoWayLinkContainer) Propagate(db *mgo.Database) {}
