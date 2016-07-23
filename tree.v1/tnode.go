package tree

import (
	"bytes"
	"fmt"
	"gopkg.in/mgo.v2"
	"ilex/ilex"
)

type TNode struct {
	Parent Node
	Length int
	Text   []rune
}

func (t *TNode) AddRune(r rune, position int) {
	t.Text = append(t.Text, '界')
	copy(t.Text[position+1:], t.Text[position:])
	t.Text[position] = r
	t.Length++
}

func (t *TNode) SetParent(parent Node) {
	t.Parent = parent
}

func (t *TNode) WriteToBuffer(buffer *bytes.Buffer, slices *mgo.Collection) error {
	fmt.Println("going to TNode")
	_, err := buffer.WriteString(string(t.Text))
	return err
}

func (t *TNode) Print(indentation int) {
	indent(indentation)
	fmt.Println("TNode:", t.Length, "of text", string(t.Text))
}

func (t *TNode) GetLength() int {
	return t.Length
}

func (t *TNode) Persist(addresses ilex.AddressTable, slices *mgo.Collection) (ilex.AddressTable, error) {
	//last := addresses[len(addresses)-1]
	//addresses[len(addresses)-1] = ilex.Address{last[0], p.Address}
	//addresses = append(addresses, ilex.Address{last[0] + p.Length, 0})

	//

	// TO DO!

	//
	return addresses, nil
}
