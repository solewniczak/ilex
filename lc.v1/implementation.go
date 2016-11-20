package lc

import (
	"errors"
	"fmt"
	"gopkg.in/mgo.v2"
	"gopkg.in/mgo.v2/bson"
	"ilex/ilex"
)

type HalfLinkContainer struct {
	Links    []ilex.HalfLink
	ToDelete []ilex.HalfLink
}

func (c HalfLinkContainer) Len() int      { return len(c.Links) }
func (c HalfLinkContainer) Swap(i, j int) { c.Links[i], c.Links[j] = c.Links[j], c.Links[i] }
func (c HalfLinkContainer) Less(i, j int) bool {
	return c.Links[i].Anchor.Range.Position < c.Links[j].Anchor.Range.Position
}

func (lc *HalfLinkContainer) Get(linkId string) (ilex.HalfLink, error) {
	for _, link := range lc.Links {
		if link.LinkId.Hex() == linkId {
			return link, nil
		}
	}
	return ilex.HalfLink{}, errors.New("Link with id " + linkId + " was not found in the links container.")
}

func (lc *HalfLinkContainer) GetCurrent() []ilex.HalfLink {
	return lc.Links
}

func isAmongLinks(link *ilex.HalfLink, linkIds []string) bool {
	idAsString := link.LinkId.Hex()
	for _, linkId := range linkIds {
		if idAsString == linkId {
			return true
		}
	}
	return false
}

func (lc *HalfLinkContainer) print() {
	fmt.Println("Link container contents:")
	for _, link := range lc.Links {
		fmt.Printf("\t[%4d,\t%4d]\n", link.Anchor.Range.Position, link.Anchor.Range.Position+link.Anchor.Range.Length-1)
	}
	fmt.Printf("+ %d links to delete.\n", len(lc.ToDelete))
}

func (lc *HalfLinkContainer) AddRunes(position, length int, linkIds []string) error {
	for _, link := range lc.Links {
		if link.Anchor.Range.Position < position && link.Anchor.Range.Position+link.Anchor.Range.Length > position && !isAmongLinks(&link, linkIds) {
			return errors.New("Splitting links with not linked text is not supported.")
		}
	}
	for i, link := range lc.Links {
		if link.Anchor.Range.Position <= position && link.Anchor.Range.Position+link.Anchor.Range.Length >= position && isAmongLinks(&link, linkIds) {
			lc.Links[i].Anchor.Range.Length += length
		} else if link.Anchor.Range.Position >= position {
			// link is shifted right
			lc.Links[i].Anchor.Range.Position += length
		}
	}
	lc.print()
	return nil
}

func (lc *HalfLinkContainer) RemoveRunes(position, length int) {
	writeIndex := 0
	removed := 0
	for _, link := range lc.Links {
		leftPosition := link.Anchor.Range.Position
		linkLength := link.Anchor.Range.Length
		rightPosition := link.Anchor.Range.Position + linkLength - 1
		if leftPosition >= position && rightPosition <= position+length-1 {
			// the link is wholly contained in the removed section. It's thus
			// removed
			lc.ToDelete = append(lc.ToDelete, link)
			removed++
		} else {
			if rightPosition < position {
				// the removed section is after the link. Do nothind
			} else if leftPosition > position+length-1 {
				//the link and the section is before the link
				link.Anchor.Range.Position -= length
			} else if leftPosition > position {
				// the removed section starts before the link
				link.Anchor.Range.Position = position
				link.Anchor.Range.Length = linkLength - (position + length - leftPosition)
			} else if rightPosition >= position+length-1 {
				// the removed section begins somewhere in the link, but does
				// not extend after it
				link.Anchor.Range.Length -= length
			} else if position+length >= rightPosition {
				// the removed section begins somewhere in the link,
				// and extends after it
				link.Anchor.Range.Length = linkLength - (rightPosition - position + 1)
			} else {
				fmt.Println("Error! Link container encountered an unexpected condition!")
			}
			lc.Links[writeIndex] = link
			writeIndex++
		}
	}
	if writeIndex+removed != len(lc.Links) {
		fmt.Println("Error! Link container is losing links!")
	}
	lc.Links = lc.Links[:writeIndex]
	lc.print()
}

func (lc *HalfLinkContainer) Persist(db *mgo.Database) error {
	var err error
	links := db.C(ilex.LINKS)
	bulk := links.Bulk()
	updates := make([]interface{}, 2*len(lc.Links))
	for i, link := range lc.Links {
		updates[2*i] = bson.M{"_id": link.LinkId}
		var update bson.M
		if link.IsLeft {
			update = bson.M{"$set": bson.M{"Left.Range.Position": link.Range.Position, "Left.Range.Length": link.Range.Length}}
		} else {
			update = bson.M{"$set": bson.M{"Right.Range.Position": link.Range.Position, "Right.Range.Length": link.Range.Length}}
		}
		updates[2*i+1] = update
	}
	bulk.Update(updates...)
	if _, err = bulk.Run(); err != nil && len(err.(*mgo.BulkError).Cases()) > 0 {
		return err
	}
	deletes := make([]interface{}, len(lc.ToDelete))
	for i, link := range lc.ToDelete {
		deletes[i] = bson.M{"_id": link.LinkId}
	}
	bulk.Remove(deletes...)
	if _, err = bulk.Run(); err != nil && len(err.(*mgo.BulkError).Cases()) > 0 {
		return err
	}
	lc.ToDelete = lc.ToDelete[:0]
	return nil
}

func (lc *HalfLinkContainer) Propagate(db *mgo.Database) {}
