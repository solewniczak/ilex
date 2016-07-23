package tree

import (
	"bytes"
	"fmt"
	"gopkg.in/mgo.v2"
	"ilex/ilex"
)

type Root struct {
	Down Node
}

func (root *Root) AddRune(r rune, position int) {
	root.Down.AddRune(r, position)
}

func (r *Root) SetParent(Node) {}

func (r *Root) WriteToBuffer(buffer *bytes.Buffer, slices *mgo.Collection) error {
	return r.Down.WriteToBuffer(buffer, slices)
}

func (r *Root) Print(indentation int) {
	indent(indentation)
	fmt.Println("ROOT")
	r.Down.Print(indentation + 1)
}

func (r *Root) GetLength() int {
	return r.Down.GetLength()
}

func (r *Root) Persist(addresses ilex.AddressTable, slices *mgo.Collection) (ilex.AddressTable, error) {
	return r.Down.Persist(addresses, slices)
}
