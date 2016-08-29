package tree

import (
	"bytes"
	"errors"
	"fmt"
	"gopkg.in/mgo.v2"
	"ilex/ilex"
)

type TNode struct {
	Parent Parent
	Length int
	Text   []rune
}

func (t *TNode) AddRune(r rune, position int) {
	t.Text = append(t.Text, '界')
	copy(t.Text[position+1:], t.Text[position:])
	t.Text[position] = r
	t.Length++
}

func (t *TNode) RemoveRune(position int) {
	t.Text = append(t.Text[:position], t.Text[position+1:]...)
	t.Length--
	if t.Length == 0 {
		t.Parent.ReduceChild(t)
	}
}

func (t *TNode) SetParent(parent Parent) {
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
	last := addresses[len(addresses)-1]
	err, text_address, text_length_runes := ilex.Persist([]byte(string(t.Text)), slices)
	if err != nil {
		return addresses, err
	}
	if text_length_runes != t.Length {
		return addresses, errors.New("Wrong length of text written to DB")
	}
	addresses[len(addresses)-1] = ilex.Address{last[0], text_address}
	addresses = append(addresses, ilex.Address{last[0] + t.Length, 0})

	persisted := &PNode{t.Parent, t.Length, text_address}
	t.Parent.ReplaceChild(t, persisted)
	return addresses, nil
}
